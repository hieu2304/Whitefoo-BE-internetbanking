const { BlobServiceClient, ContainerSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } = require('@azure/storage-blob');
const uuid = require('uuid');
const intoStream = require('into-stream');
const Storage = require('../services/files/storage.service');
const User = require('../services/users/user.service');

async function getListBlob(req, res) {
	const user = await User.findByPk(req.session.user.id);
	if (user.userType !== '0') {
		return res.status(403).send({ code: 'PERMISSION_DENIED', message: 'You do not have permission to index this container.' });
	}
	const containerName = req.body.container;
	const userId = req.body.userId;
	const blobs = await Storage.findAllBlobsByUserId(containerName, userId);
	return res.status(200).send(blobs);
}

async function getIdCard(req, res) {
	const blob = await Storage.findByPk(req.body.id);
	if (!blob) {
		return res.status(404).send({ message: 'File not found.' });
	}
	const blobUri = blobUriGenerator(blob.container, blob.blobName);
	return res.status(200).send({ uri: blobUri });
};

async function postIdCard(req, res) {
	// Create a unique name for the blob
	const sub = uuid.v1();
	const containerName = 'idcards';
	const blobName = `${sub}/${req.file.originalname}`;
	const fileStream = intoStream(req.file.buffer);
	const userId = req.session.user.id;
	// Upload and save result to database
	const upload = await blobUploadAsync(containerName, blobName, fileStream, req.file.buffer.length, req.file.mimetype, userId);
	return res.status(200).send(upload);
};

async function deleteIdCard(req, res) {
	const user = await User.findByPk(req.session.user.id);
	if (user.userType !== '0') {
		return res.status(403).send({ code: 'PERMISSION_DENIED', message: 'You do not have permission to delete this file.' });
	}
	const blob = await Storage.findByPk(req.body.id);
	if (!blob) {
		return res.status(404).send({ message: 'File not found.' });
	}
	// Remove from blob storage and database
	else if (blobDeleteAsync(blob.id, blob.container, blob.blobName)) {
		return res.status(200).send({ message: 'Blob deleted successfully.' });
	}
	return res.status(404).send({ message: 'File not found on blob storage.' });;
};

async function blobUploadAsync(containerName, blobName, fileStream, fileLength, mimeType, userId) {
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
		blobName: blobName,
		blobSize: fileLength,
		mimeType: mimeType,
		userId: userId
	});
	// Return upload result
	return upload;
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
		permissions: ContainerSASPermissions.parse("r"),
		startsOn: startDate,
		expiresOn: expiryDate
	}, sharedKeyCredential).toString();
	return `${process.env.AZURE_STORAGE_URL}/${containerName}/${blobName}?${sasToken}`;
}

async function blobDeleteAsync(id, containerName, blobName) {
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
	getListBlob,
	getIdCard,
	postIdCard,
	deleteIdCard
}