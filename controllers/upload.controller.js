const { BlobServiceClient } = require('@azure/storage-blob');
const uuid = require('uuid');
const intoStream = require('into-stream');
const asyncHandler = require('express-async-handler');

module.exports.postUpload = function (req, res, next) {
	//some logical here
	if (!req.body.clientId || !req.body.secretKey) {
		return res.status(403).send({ message: 'The request is missing a valid credential.' });
	}
	else if (req.body.clientId != process.env.CLIENT_ID || req.body.secretKey != process.env.SECRET_KEY) {
		return res.status(403).send({ message: 'Invalid credential.' });
	}
	req.files.forEach(asyncHandler(async file => {
		// Create the BlobServiceClient object which will be used to create a container client
		const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
		// Create a unique name for the container
		const containerName = 'idcards';
		// Get a reference to a container
		const containerClient = blobServiceClient.getContainerClient(containerName);
		// Create the container
		if (!containerClient.exists()) {
			const createContainerResponse = await containerClient.create();
			console.log("Container was created successfully. requestId: ", createContainerResponse.requestId);
		}
		// Create a unique name for the blob
		const blobName = `${uuid.v1()}/${file.originalname}`;
		const stream = intoStream(file.buffer);
		// Get a block blob client
		const blockBlobClient = containerClient.getBlockBlobClient(blobName);
		// Upload data to the blob
		const uploadBlobResponse = await blockBlobClient.uploadStream(stream, file.buffer.length);
		console.log("Blob was uploaded successfully. requestId: ", uploadBlobResponse.requestId);
	}));
	//if success
	return res.status(200).send('req.files');
};
