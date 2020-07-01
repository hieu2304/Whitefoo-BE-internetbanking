const { BlobServiceClient, ContainerSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } = require('@azure/storage-blob');
const uuid = require('uuid');
const intoStream = require('into-stream');
const sharp = require('sharp');
const Storage = require('../services/files/storage.service');
const User = require('../services/users/user.service');

const originalQuality = 'original';
const normalQuality = 'normal';
const thumbnailQuality = 'thumbnail';
const smallQuality = 'smol';

async function getListBlobs(req, res) {
	const user = await User.findByPk(currentUser.id);
	if (user.userType !== '0') {
		return res.status(403).send({ code: 'PERMISSION_DENIED', message: 'You do not have permission to index this container.' });
	}
	const containerName = req.body.container;
	const userId = req.body.userId;
	const blobs = await Storage.findAllBlobsByUserId(containerName, userId);
	return res.status(200).send(blobs);
}

async function getIdCard(req, res) {
	const user = await User.findByPk(currentUser.id);
	if (user.userType !== '0') {
		return res.status(403).send({ code: 'PERMISSION_DENIED', message: 'You do not have permission to view this file.' });
	}
	const blob = await Storage.findByPk(req.body.id);
	if (!blob) {
		return res.status(404).send({ message: 'File not found.' });
	}
	const blobName = `${blob.uuid}/${blob.quality}/${blob.blobName}`;
	const blobUri = blobUriGenerator(blob.container, blobName);
	return res.status(200).send({ uri: blobUri });
}

async function postIdCard(req, res) {
	if (!req.file) {
		return res.status(404).send({ message: 'No file provided.' });
	}
	// Create a container name for storing blob
	const containerName = 'idcards';
	// Create a unique uuid to contain the blobs
	const blobUuid = uuid.v1();
	// Temporary fix
	const userId = 1;
	// File name
	const fileName = req.file.originalname;
	// Upload the original version
	const upload = await blobUploadAsync(containerName, blobUuid, fileName, req.file.buffer, req.file.buffer.length, req.file.mimetype, originalQuality, userId);
	// Upload the resized version at normal level
	let resizedFile = await imageResize(req.file.buffer, 960, 540);
	const uploadNormal = await blobUploadAsync(containerName, blobUuid, fileName, resizedFile, resizedFile.length, req.file.mimetype, normalQuality, userId);
	// Upload the resized version at thumbnail level
	resizedFile = await imageResize(req.file.buffer, 426, 240);
	const uploadThumbnail = await blobUploadAsync(containerName, blobUuid, fileName, resizedFile, resizedFile.length, req.file.mimetype, thumbnailQuality, userId);
	// Upload the resized version at small level
	resizedFile = await imageResize(req.file.buffer, 50, 50);
	const uploadSmall = await blobUploadAsync(containerName, blobUuid, fileName, resizedFile, resizedFile.length, req.file.mimetype, smallQuality, userId);
	// Return success message
	return res.status(200).send({upload, uploadNormal, uploadThumbnail, uploadSmall});
}

async function deleteIdCard(req, res) {
	const user = await User.findByPk(currentUser.id);
	if (user.userType !== '0') {
		return res.status(403).send({ code: 'PERMISSION_DENIED', message: 'You do not have permission to delete this file.' });
	}
	const blob = await Storage.findByPk(req.body.id);
	if (!blob) {
		return res.status(404).send({ message: 'File not found.' });
	} else if (blobDeleteAsync(blob.id, blob.container, blob.uuid, blob.quality, blob.blobName)) {
		// Remove from blob storage and database
		return res.status(200).send({ message: 'Blob deleted successfully.' });
	}
	return res.status(404).send({ message: 'File not found on blob storage.' });
}

async function blobUploadAsync(containerName, blobUuid, fileName, fileBuffer, fileLength, mimeType, quality, userId) {
	// Create a unique name for the blob
	const blobName = `${blobUuid}/${quality}/${fileName}`;
	// Create file stream
	const fileStream = intoStream(fileBuffer);
	// Create the BlobServiceClient object which will be used to create a container client
	const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
	// Get a reference to a container
	const containerClient = blobServiceClient.getContainerClient(containerName);
	// Create the container
	if (!containerClient.exists()) {
		const createContainerResponse = await containerClient.create();
		//console.log("Container was created successfully. requestId: ", createContainerResponse.requestId);
	}
	// Get a block blob client
	const blockBlobClient = containerClient.getBlockBlobClient(blobName);
	// Upload data to the blob
	const uploadBlobResponse = await blockBlobClient.uploadStream(fileStream, fileLength);
	//console.log("Blob was uploaded successfully. requestId: ", uploadBlobResponse.requestId);
	// Save to storage database
	const upload = await Storage.create({
		container: containerName,
		uuid: blobUuid,
		blobName: fileName,
		blobSize: fileLength,
		quality: quality,
		mimeType: mimeType,
		userId: userId
	});
	// Return upload result
	return upload;
}

// WIP
async function imageResize(fileBuffer, width, height) {
	// Preserving aspect ratio, resize the image to be as large as possible while ensuring its dimensions are less than or equal to both those specified
	// Do not enlarge if the width or height are already less than the specified dimensions
	const transformer = await sharp(fileBuffer).resize(width, height, { fit: 'inside', withoutEnlargement: true }).toBuffer();
	return transformer;
}

function blobUriGenerator(containerName, blobName) {
	// The following values can be used for permissions:
	// "a" (Add), "r" (Read), "w" (Write), "d" (Delete), "l" (List)
	// Concatenate multiple permissions, such as "rwa" = Read, Write, Add
	// Create the StorageSharedKeyCredential object which will be used to get the sas token
	const sharedKeyCredential = new StorageSharedKeyCredential(process.env.AZURE_STORAGE_ACCOUNT_NAME, process.env.AZURE_STORAGE_ACCOUNT_KEY);
	// Create a SAS token that expires in one day
	// Set start time to five minutes ago to avoid clock skew.
	const startDate = new Date();
	startDate.setMinutes(startDate.getMinutes() - 5);
	const expiryDate = new Date(startDate);
	expiryDate.setDate(startDate.getDate() + 1);
	const sasToken = generateBlobSASQueryParameters({
		containerName: containerName,
		blobName: blobName,
		permissions: ContainerSASPermissions.parse('r'),
		startsOn: startDate,
		expiresOn: expiryDate
	}, sharedKeyCredential).toString();
	return `${process.env.AZURE_STORAGE_URL}/${containerName}/${blobName}?${sasToken}`;
}

async function blobDeleteAsync(id, containerName, blobUuid, quality, fileName) {
	const blobName = `${blobUuid}/${quality}/${fileName}`;
	const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
	const containerClient = blobServiceClient.getContainerClient(containerName);
	if (containerClient.exists()) {
		const blockBlobClient = containerClient.getBlockBlobClient(blobName);
		if (blockBlobClient.exists()) {
			blockBlobClient.delete();
			Storage.removeById(id);
			return true;
		}
	}
	return false;
}

module.exports = {
	getListBlobs,
	getIdCard,
	postIdCard,
	deleteIdCard
};
