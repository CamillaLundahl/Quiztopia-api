import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../utils/dynamodb.js';

const createResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body)
});

const registerHandler = async (event) => {
  const { username, password } = event.body;

  if (!username || !password) {
    return createResponse(400, { message: 'Username and password required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await db.put({
      Item: {
        PK: `USER#${userId}`,
        SK: `USER#${userId}`,
        username,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      }
    });

    return createResponse(201, { message: 'User created successfully', userId });
  } catch (error) {
    console.error('Error creating user:', error);
    return createResponse(500, { message: 'Could not create user', error: error.message });
  }
};

const loginHandler = async (event) => {
  const { username, password } = event.body;

  if (!username || !password) {
    return createResponse(400, { message: 'Username and password required' });
  }

  try {
    const result = await db.scan({
      FilterExpression: 'username = :username',
      ExpressionAttributeValues: { ':username': username }
    });

    if (result.Items.length === 0) {
      return createResponse(401, { message: 'Invalid credentials' });
    }

    const user = result.Items[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return createResponse(401, { message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.PK.replace('USER#', ''), username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return createResponse(200, { token });
  } catch (error) {
    console.error('Error logging in:', error);
    return createResponse(500, { message: 'Could not login', error: error.message });
  }
};

export const register = middy(registerHandler)
  .use(jsonBodyParser())
  .use(cors())
  .use(httpErrorHandler());

export const login = middy(loginHandler)
  .use(jsonBodyParser())
  .use(cors())
  .use(httpErrorHandler());
