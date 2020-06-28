const { BlobServiceClient, ContainerSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } = require('@azure/storage-blob');
const uuid = require('uuid');
const intoStream = require('into-stream');
const storage = require('../services/files/storage.service');

function validateCredential (clientId, secretKey) {
	if (clientId !== process.env.CLIENT_ID || secretKey !== process.env.SECRET_KEY) {
		return false;
	}
	return true;
}

async function getIdCard (req, res, next) {
	// Validate credential
	if (!req.body.clientId || !req.body.secretKey) {
		return res.status(403).send({ message: 'The request is missing a valid credential.' });
	}
	else if (!validateCredential(req.body.clientId, req.body.secretKey)) {
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
	return res.status(200).send({
		uri: `${process.env.AZURE_STORAGE_URL}/${blob.container}/${blob.blobName}?${sasToken}`
	});
};

async function postIdCard (req, res, next) {
	// Validate credential
	if (!req.body.clientId || !req.body.secretKey) {
		return res.status(403).send({ message: 'The request is missing a valid credential.' });
	}
	else if (!validateCredential(req.body.clientId, req.body.secretKey)) {
		return res.status(403).send({ message: 'Invalid credential.' });
	}
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
	const blobName = `${uuid.v1()}/${req.file.originalname}`;
	const stream = intoStream(req.file.buffer);
	const size = req.file.buffer.length;
	// Get a block blob client
	const blockBlobClient = containerClient.getBlockBlobClient(blobName);
	// Upload data to the blob
	const uploadBlobResponse = await blockBlobClient.uploadStream(stream, size);
	//console.log("Blob was uploaded successfully. requestId: ", uploadBlobResponse.requestId);
	const upload = {
		container: containerName,
		blobName: blobName,
		blobSize: size,
		mimeType: req.file.mimetype,
		userId: req.session.user.id
	};
	await storage.create(upload)
	//if success
	return res.status(200).send(upload);
};

async function deleteIdCard (req, res, next) {
	return res.status(403);
};

module.exports = {
	getIdCard,
	postIdCard,
	deleteIdCard
}