const { BlobServiceClient, ContainerSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } = require('@azure/storage-blob');
const uuid = require('uuid');
const intoStream = require('into-stream');
const sharp = require('sharp');
const Storage = require('../services/files/storage.service');
const User = require('../services/users/user.service');
const jwtHelper = require('../helpers/jwt.helper');

const originalQuality = 'original';
const normalQuality = 'normal';
const thumbnailQuality = 'thumbnail';
const smallQuality = 'smol';

const idCardContainer = 'idcards';
const avatarContainer = 'avatar';
const audioContainer = 'audio';

async function getBlobList(req, res) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}
	const user = await User.findByPk(currentUser.id);
	if (user.userType !== 0) {
		return res.status(403).send({ code: 'PERMISSION_DENIED', message: 'You do not have permission to index this container.' });
	}
	const containerName = req.query.container;
	const userId = req.query.userId;
	const blobs = await Storage.findAllBlobsByUserId(containerName, userId);
	if (!blobs) {
		return res.status(404).send({ message: 'This user has 0 file.' });
	}
	const blobUris = createUriList(blobs);
	return res.status(200).send(blobUris);
}

async function deleteBlobList(req, res) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}
	const user = await User.findByPk(currentUser.id);
	if (user.userType !== 0) {
		return res.status(403).send({ code: 'PERMISSION_DENIED', message: 'You do not have permission to delete these file(s).' });
	}
	const containerName = req.query.container;
	const userId = req.query.userId;
	const blobs = await Storage.findAllBlobsByUserId(containerName, userId);
	if (!blobs) {
		return res.status(404).send({ message: 'There is no file.' });
	}
	const deleted = await deleteDataListAsync(blobs);
	return res.status(200).send({ message: `Successfully deleted ${deleted} file(s).` });
}

async function getIdCard(req, res) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}
	const user = await User.findByPk(currentUser.id);
	if (user.userType !== 0) {
		return res.status(403).send({ code: 'PERMISSION_DENIED', message: 'You do not have permission to view this file.' });
	}
	const blob = await Storage.findOneBlob(idCardContainer, req.query.id);
	if (!blob) {
		return res.status(404).send({ message: 'File not found.' });
	}
	const blobName = `${blob.uuid}/${blob.quality}/${blob.blobName}`;
	const blobUri = blobUriGenerator(blob.container, blobName);
	return res.status(200).send({ file: blob.blobName, uri: blobUri });
}

async function getIdCards(req, res) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}
	const user = await User.findByPk(currentUser.id);
	if (user.userType !== 0) {
		return res.status(403).send({ code: 'PERMISSION_DENIED', message: 'You do not have permission to index this container.' });
	}
	const userId = req.query.userId;
	const blobs = await Storage.findQualityBlobsByUserId(idCardContainer, userId, originalQuality);
	if (!blobs) {
		return res.status(404).send({ message: 'Result empty.' });
	}
	const blobUris = createImageUriList(blobs);
	return res.status(200).send(blobUris);
}

async function postIdCard(req, res) {
	if (!req.file) {
		return res.status(404).send({ message: 'No file provided.' });
	}
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Unauthorized user' });
	}
	// Create a container name for storing blob
	const containerName = idCardContainer;
	// Create a unique uuid to contain the blobs
	const blobUuid = uuid.v1();
	// Current user id
	const userId = currentUser.id;
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
	return res.status(201).send({ message: 'Success' });
}

async function deleteIdCard(req, res) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}
	const user = await User.findByPk(currentUser.id);
	if (user.userType !== 0) {
		return res.status(403).send({ code: 'PERMISSION_DENIED', message: 'You do not have permission to delete this file.' });
	}
	const blob = await Storage.findByPk(req.query.id);
	if (!blob) {
		return res.status(404).send({ message: 'File not found.' });
	} else if (await blobDeleteAsync(blob.id, blob.container, blob.uuid, blob.quality, blob.blobName)) {
		// Remove from blob storage and database
		return res.status(200).send({ message: 'Blob deleted successfully.' });
	}
	return res.status(404).send({ message: 'File not found on blob storage.' });
}

async function deleteIdCards(req, res) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}
	const user = await User.findByPk(currentUser.id);
	if (user.userType !== 0) {
		return res.status(403).send({ code: 'PERMISSION_DENIED', message: 'You do not have permission to delete these file(s).' });
	}
	const userId = req.query.userId;
	const blobs = await Storage.findAllBlobsByUserId(idCardContainer, userId);
	if (!blobs) {
		return res.status(404).send({ message: 'There is nothing.' });
	}
	const deleted = await deleteDataListAsync(blobs);
	return res.status(200).send({ message: `Successfully deleted ${deleted} file(s).` });
}

async function getAvatar(req, res) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}
	const blob = await Storage.findOneBlobByUserId(avatarContainer, currentUser.id);
	if (!blob) {
		return res.status(404).send({ message: 'File not found.' });
	}
	const blobName = `${blob.uuid}/${blob.quality}/${blob.blobName}`;
	const blobUri = blobUriGenerator(blob.container, blobName);
	return res.status(200).send({ file: blob.blobName, uri: blobUri });
}

async function getAvatars(req, res) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}
	let userId = currentUser.id;
	const user = await User.findByPk(currentUser.id);
	if (req.query.userId && user.userType === 0) {
		userId = req.query.userId;
	}
	const blobs = await Storage.findQualityBlobsByUserId(avatarContainer, userId, originalQuality);
	if (!blobs) {
		return res.status(404).send({ message: 'Result empty.' });
	}
	const blobUris = createImageUriList(blobs);
	return res.status(200).send(blobUris);
}

async function postAvatar(req, res) {
	if (!req.file) {
		return res.status(404).send({ message: 'No file provided.' });
	}
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Unauthorized user' });
	}
	const blobCount = await Storage.countBlobByUserId(avatarContainer, currentUser.id);
	if (blobCount > 0) {
		return res.status(405).send({ message: 'User already has an avatar.' });
	}
	const containerName = avatarContainer;
	const blobUuid = uuid.v1();
	const userId = currentUser.id;
	const fileName = req.file.originalname;
	const upload = await blobUploadAsync(containerName, blobUuid, fileName, req.file.buffer, req.file.buffer.length, req.file.mimetype, originalQuality, userId);
	let resizedFile = await imageResize(req.file.buffer, 960, 540);
	const uploadNormal = await blobUploadAsync(containerName, blobUuid, fileName, resizedFile, resizedFile.length, req.file.mimetype, normalQuality, userId);
	resizedFile = await imageResize(req.file.buffer, 426, 240);
	const uploadThumbnail = await blobUploadAsync(containerName, blobUuid, fileName, resizedFile, resizedFile.length, req.file.mimetype, thumbnailQuality, userId);
	resizedFile = await imageResize(req.file.buffer, 50, 50);
	const uploadSmall = await blobUploadAsync(containerName, blobUuid, fileName, resizedFile, resizedFile.length, req.file.mimetype, smallQuality, userId);
	return res.status(201).send({ message: 'Success' });
}

async function putAvatar(req, res) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Unauthorized user' });
	}
	// Remove old stuff first
	const blobs = await Storage.findAllBlobsByUserId(avatarContainer, currentUser.id);
	if (blobs) {
		await deleteDataListAsync(blobs);
	}
	// Upload the newer, if there is
	if (req.file) {
		const containerName = avatarContainer;
		const blobUuid = uuid.v1();
		const userId = currentUser.id;
		const fileName = req.file.originalname;
		const upload = await blobUploadAsync(containerName, blobUuid, fileName, req.file.buffer, req.file.buffer.length, req.file.mimetype, originalQuality, userId);
		let resizedFile = await imageResize(req.file.buffer, 960, 540);
		const uploadNormal = await blobUploadAsync(containerName, blobUuid, fileName, resizedFile, resizedFile.length, req.file.mimetype, normalQuality, userId);
		resizedFile = await imageResize(req.file.buffer, 426, 240);
		const uploadThumbnail = await blobUploadAsync(containerName, blobUuid, fileName, resizedFile, resizedFile.length, req.file.mimetype, thumbnailQuality, userId);
		resizedFile = await imageResize(req.file.buffer, 50, 50);
		const uploadSmall = await blobUploadAsync(containerName, blobUuid, fileName, resizedFile, resizedFile.length, req.file.mimetype, smallQuality, userId);
		return res.status(201).send({ message: 'Success' });
	}
	return res.status(200).send({ message: 'Avatars cleaned up' });
}

async function deleteAvatar(req, res) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}
	const blob = await Storage.findOneBlobByUserId(avatarContainer, currentUser.id);
	if (!blob) {
		return res.status(404).send({ message: 'File not found.' });
	} else if (await blobDeleteAsync(blob.id, blob.container, blob.uuid, blob.quality, blob.blobName)) {
		// Remove from blob storage and database
		return res.status(200).send({ message: 'Blob deleted successfully.' });
	}
	return res.status(404).send({ message: 'File not found on blob storage.' });
}

async function deleteAvatars(req, res) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}
	const blobs = await Storage.findAllBlobsByUserId(avatarContainer, currentUser.id);
	if (!blobs) {
		return res.status(404).send({ message: 'There is nothing.' });
	}
	const deleted = await deleteDataListAsync(blobs);
	return res.status(200).send({ message: `Successfully deleted ${deleted} file(s).` });
}

async function getAudio(req, res) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}
	const blob = await Storage.findOneBlobByUserId(audioContainer, currentUser.id);
	if (!blob) {
		return res.status(404).send({ message: 'File not found.' });
	}
	const blobName = `${blob.uuid}/${blob.quality}/${blob.blobName}`;
	const blobUri = blobUriGenerator(blob.container, blobName);
	return res.status(200).send({ file: blob.blobName, uri: blobUri });
}

async function getAudios(req, res) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}
	let userId = currentUser.id;
	const user = await User.findByPk(currentUser.id);
	if (req.query.userId && user.userType === 0) {
		userId = req.query.userId;
	}
	const blobs = await Storage.findQualityBlobsByUserId(audioContainer, userId, originalQuality);
	if (!blobs) {
		return res.status(404).send({ message: 'Result empty.' });
	}
	const blobUris = createUriList(blobs);
	return res.status(200).send(blobUris);
}

async function postAudio(req, res) {
	if (!req.file) {
		return res.status(404).send({ message: 'No file provided.' });
	}
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Unauthorized user' });
	}
	const containerName = audioContainer;
	const blobUuid = uuid.v1();
	const userId = currentUser.id;
	const fileName = req.file.originalname;
	const upload = await blobUploadAsync(containerName, blobUuid, fileName, req.file.buffer, req.file.buffer.length, req.file.mimetype, originalQuality, userId);
	return res.status(201).send({ message: 'Success' });
}

async function putAudio(req, res) {
	if (!req.file) {
		return res.status(404).send({ message: 'No file provided.' });
	}
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Unauthorized user' });
	}
	const blobs = await Storage.findAllBlobsByUserId(audioContainer, currentUser.id);
	if (blobs) {
		await deleteDataListAsync(blobs);
	}
	if (req.file) {
		const containerName = audioContainer;
		const blobUuid = uuid.v1();
		const userId = currentUser.id;
		const fileName = req.file.originalname;
		const upload = await blobUploadAsync(containerName, blobUuid, fileName, req.file.buffer, req.file.buffer.length, req.file.mimetype, originalQuality, userId);
		return res.status(201).send({ message: 'Success' });
	}
	return res.status(200).send({ message: 'Audio cleaned up' });
}

async function deleteAudio(req, res) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}
	const blob = await Storage.findOneBlobByUserId(audioContainer, currentUser.id);
	if (!blob) {
		return res.status(404).send({ message: 'File not found.' });
	} else if (await blobDeleteAsync(blob.id, blob.container, blob.uuid, blob.quality, blob.blobName)) {
		return res.status(200).send({ message: 'Blob deleted successfully.' });
	}
	return res.status(404).send({ message: 'File not found on blob storage.' });
}

async function deleteAudios(req, res) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}
	const blobs = await Storage.findAllBlobsByUserId(audioContainer, currentUser.id);
	if (!blobs) {
		return res.status(404).send({ message: 'There is no audio.' });
	}
	const deleted = await deleteDataListAsync(blobs);
	return res.status(200).send({ message: `Successfully deleted ${deleted} file(s).` });
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
	// Create upload options
	const options = {
		blobHTTPHeaders: { blobContentType: mimeType }
	}
	// Upload data to the blob
	const uploadBlobResponse = await blockBlobClient.uploadStream(fileStream, fileLength, 5, options);
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

async function imageResize(fileBuffer, width, height) {
	// Preserving aspect ratio, resize the image to be as large as possible while ensuring its dimensions are less than or equal to both those specified
	// Do not enlarge if the width or height are already less than the specified dimensions
	const transformer = await sharp(fileBuffer)
		.resize(width, height, { fit: 'inside', withoutEnlargement: true })
		.toBuffer();
	return transformer;
}

function createUriList(blobs) {
	const blobUris = [];
	for (const blob of blobs) {
		const blobName = `${blob.uuid}/${blob.quality}/${blob.blobName}`;
		const blobUri = blobUriGenerator(blob.container, blobName);
		blobUris.push({ file: blob.blobName, quality: blob.quality, mimeType: blob.mimeType, uri: blobUri });
	}
	return blobUris;
}

function createImageUriList(blobs) {
	const blobUris = [];
	for (const blob of blobs) {
		if (blob.quality === originalQuality) {
			const blobName = `${blob.uuid}/${blob.quality}/${blob.blobName}`;
			const blobUri = blobUriGenerator(blob.container, blobName);
			const blobNameNormal = `${blob.uuid}/${normalQuality}/${blob.blobName}`;
			const blobUriNormal = blobUriGenerator(blob.container, blobNameNormal);
			const blobNameThumbnail = `${blob.uuid}/${thumbnailQuality}/${blob.blobName}`;
			const blobUriThumbnail = blobUriGenerator(blob.container, blobNameThumbnail);
			const blobNameSmall = `${blob.uuid}/${smallQuality}/${blob.blobName}`;
			const blobUriSmall = blobUriGenerator(blob.container, blobNameSmall);
			blobUris.push({
				file: blob.blobName,
				original: blobUri,
				normal: blobUriNormal,
				thumbnail: blobUriThumbnail,
				small: blobUriSmall
			});
		}
	}
	return blobUris;
}

async function deleteDataListAsync(blobs) {
	let deleted = 0;
	for (const blob of blobs) {
		if (await blobDeleteAsync(blob.id, blob.container, blob.uuid, blob.quality, blob.blobName)) {
			deleted++;
		}
	}
	return deleted;
}

function blobUriGenerator(containerName, blobName) {
	// The following values can be used for permissions:
	// "a" (Add), "r" (Read), "w" (Write), "d" (Delete), "l" (List)
	// Concatenate multiple permissions, such as "rwa" = Read, Write, Add
	// Create the StorageSharedKeyCredential object which will be used to get the sas token
	const sharedKeyCredential = new StorageSharedKeyCredential(
		process.env.AZURE_STORAGE_ACCOUNT_NAME,
		process.env.AZURE_STORAGE_ACCOUNT_KEY
	);
	// Create a SAS token that expires in one day
	// Set start time to five minutes ago to avoid clock skew.
	const startDate = new Date();
	startDate.setMinutes(startDate.getMinutes() - 5);
	const expiryDate = new Date(startDate);
	expiryDate.setDate(startDate.getDate() + 1);
	const sasToken = generateBlobSASQueryParameters(
		{
			containerName: containerName,
			blobName: blobName,
			permissions: ContainerSASPermissions.parse('r'),
			startsOn: startDate,
			expiresOn: expiryDate
		},
		sharedKeyCredential
	).toString();
	return `${process.env.AZURE_STORAGE_URL}/${containerName}/${blobName}?${sasToken}`;
}

async function blobDeleteAsync(id, containerName, blobUuid, quality, fileName) {
	const blobName = `${blobUuid}/${quality}/${fileName}`;
	const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
	const containerClient = blobServiceClient.getContainerClient(containerName);
	if (containerClient.exists()) {
		const blockBlobClient = containerClient.getBlockBlobClient(blobName);
		if (blockBlobClient.exists()) {
			await blockBlobClient.delete();
			await Storage.removeById(id);
			return true;
		}
	}
	return false;
}

module.exports = {
	getBlobList,
	deleteBlobList,
	getIdCard,
	postIdCard,
	deleteIdCard,
	getIdCards,
	deleteIdCards,
	getAvatar,
	postAvatar,
	putAvatar,
	deleteAvatar,
	deleteAvatars,
	getAvatars,
	getAudio,
	postAudio,
	putAudio,
	deleteAudio,
	getAudios,
	deleteAudios
};
