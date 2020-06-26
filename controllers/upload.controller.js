const { BlobServiceClient, ContainerSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } = require('@azure/storage-blob');
const uuid = require('uuid');
const intoStream = require('into-stream');
const asyncHandler = require('express-async-handler');
const storage = require('../services/files/storage.service');

module.exports.getUpload = asyncHandler(async function (req, res, next) {
	console.log('ok');
	if (!req.body.clientId || !req.body.secretKey) {
		return res.status(403).send({ message: 'The request is missing a valid credential.' });
	}
	else if (req.body.clientId != process.env.CLIENT_ID || req.body.secretKey != process.env.SECRET_KEY) {
		return res.status(403).send({ message: 'Invalid credential.' });
	}
	const id = req.body.id;
	const blob = await storage.findByPk(id);
	if (!blob) {
		return res.status(404);
	}
	// The following values can be used for permissions: 
	// "a" (Add), "r" (Read), "w" (Write), "d" (Delete), "l" (List)
	// Concatenate multiple permissions, such as "rwa" = Read, Write, Add
	// Create the StorageSharedKeyCredential object which will be used to get the sas token
	const sharedKeyCredential = new StorageSharedKeyCredential(process.env.AZURE_STORAGE_ACCOUNT_NAME, process.env.AZURE_STORAGE_ACCOUNT_KEY);
	// Create a SAS token that expires in an hour
	// Set start time to five minutes ago to avoid clock skew.
	const startDate = new Date();
	startDate.setMinutes(startDate.getMinutes() - 5);
	const expiryDate = new Date(startDate);
	expiryDate.setMinutes(startDate.getMinutes() + 60);
	const sasToken = generateBlobSASQueryParameters({
		containerName: blob.container,
		blobName: blob.blobName,
		permissions: ContainerSASPermissions.parse("r"),
		startsOn: startDate,
		expiresOn: expiryDate
	}, sharedKeyCredential).toString();
	res.status(200).send({
		uri: `${process.env.AZURE_STORAGE_URL}/${blob.container}/${blob.blobName}?${sasToken}`
	});
});

module.exports.postUpload = asyncHandler(async function (req, res, next) {
	//some logical here
	if (!req.body.clientId || !req.body.secretKey) {
		return res.status(403).send({ message: 'The request is missing a valid credential.' });
	}
	else if (req.body.clientId != process.env.CLIENT_ID || req.body.secretKey != process.env.SECRET_KEY) {
		return res.status(403).send({ message: 'Invalid credential.' });
	}
	const uploads = [];
	for (const file of req.files) {
		// Create the BlobServiceClient object which will be used to create a container client
		const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
		// Create a unique name for the container
		const containerName = 'idcards';
		// Get a reference to a container
		const containerClient = blobServiceClient.getContainerClient(containerName);
		// Create the container
		if (!containerClient.exists()) {
			const createContainerResponse = await containerClient.create();
			//console.log("Container was created successfully. requestId: ", createContainerResponse.requestId);
		}
		// Create a unique name for the blob
		const blobName = `${uuid.v1()}/${file.originalname}`;
		const stream = intoStream(file.buffer);
		const size = file.buffer.length;
		// Get a block blob client
		const blockBlobClient = containerClient.getBlockBlobClient(blobName);
		// Upload data to the blob
		const uploadBlobResponse = await blockBlobClient.uploadStream(stream, size);
		//console.log("Blob was uploaded successfully. requestId: ", uploadBlobResponse.requestId);
		const upload = {
			container: containerName,
			blobName: blobName,
			blobSize: size,
			mimeType: file.mimetype
		};
		await storage.create(upload)
		uploads.push(upload);
	};
	//if success
	return res.status(200).send(uploads);
});

module.exports.deleteUpload = asyncHandler(async function (req, res, next) {
	return res.status(403);
});