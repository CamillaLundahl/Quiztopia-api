import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.DYNAMODB_TABLE;

const get = (params) => dynamodb.get({ TableName, ...params }).promise();
const put = (params) => dynamodb.put({ TableName, ...params }).promise();
const query = (params) => dynamodb.query({ TableName, ...params }).promise();
const scan = (params) => dynamodb.scan({ TableName, ...params }).promise();
const update = (params) => dynamodb.update({ TableName, ...params }).promise();
const del = (params) => dynamodb.delete({ TableName, ...params }).promise();

export default { get, put, query, scan, update, delete: del };
