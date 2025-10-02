import db from '../utils/dynamodb.js';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const getUserIdFromToken = (event) => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) return null;
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Publik endpoint
const getAllQuizzes = async () => {
  const result = await db.scan({
    FilterExpression: 'begins_with(PK, :pk) AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': 'QUIZ#',
      ':sk': 'QUIZ#'
    }
  });

  return result.Items.map(item => ({
    quizId: item.PK.replace('QUIZ#', ''),
    name: item.name,
    description: item.description,
    createdBy: item.createdBy,
    createdAt: item.createdAt
  }));
};

// Kräver autentisering
const createQuiz = async (name, description, userId) => {
  if (!name) throw new Error('Quiz name is required');
  if (!userId) throw new Error('Unauthorized: User ID missing');

  const quizId = uuidv4();
  const createdAt = new Date().toISOString();

  await db.put({
    Item: {
      PK: `QUIZ#${quizId}`,
      SK: `QUIZ#${quizId}`,
      quizId,
      name,
      description: description || '',
      createdBy: userId,
      createdAt
    }
  });

  return { message: 'Quiz created successfully', quizId, name, createdBy: userId };
};

const getQuizById = async (quizId) => {
  if (!quizId) throw new Error('Quiz ID is required');

  const [quizResult, questionsResult] = await Promise.all([
    db.get({
      Key: { PK: `QUIZ#${quizId}`, SK: `QUIZ#${quizId}` }
    }),
    db.query({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `QUIZ#${quizId}`,
        ':sk': 'QUESTION#'
      }
    })
  ]);

  if (!quizResult.Item) throw new Error('Quiz not found');

  const questions = questionsResult.Items.map(item => ({
    questionId: item.questionId,
    question: item.question,
    answer: item.answer,
    longitude: item.longitude,
    latitude: item.latitude,
    createdAt: item.createdAt
  }));

  return {
    quizId: quizResult.Item.PK.replace('QUIZ#', ''),
    name: quizResult.Item.name,
    description: quizResult.Item.description,
    createdBy: quizResult.Item.createdBy,
    createdAt: quizResult.Item.createdAt,
    questions
  };
};

const deleteQuiz = async (quizId, userId) => {
  if (!quizId) throw new Error('Quiz ID is required');
  if (!userId) throw new Error('Unauthorized: User ID missing');

  const quizKey = { PK: `QUIZ#${quizId}`, SK: `QUIZ#${quizId}` };
  const result = await db.get({ Key: quizKey });

  if (!result.Item) throw new Error('Quiz not found');
  if (result.Item.createdBy !== userId) {
    throw new Error('Unauthorized: You can only delete your own quizzes');
  }

  const questionsResult = await db.query({
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `QUIZ#${quizId}`,
      ':sk': 'QUESTION#'
    }
  });

  const deletePromises = [
    ...questionsResult.Items.map(question => 
      db.delete({ Key: { PK: question.PK, SK: question.SK } })
    ),
    db.delete({ Key: quizKey })
  ];

  await Promise.all(deletePromises);

  return { 
    message: 'Quiz and all questions deleted successfully', 
    quizId,
    deletedQuestions: questionsResult.Items.length
  };
};

const addQuestion = async (quizId, question, answer, longitude, latitude, userId) => {
  if (!quizId) throw new Error('Quiz ID is required');
  if (!question) throw new Error('Question is required');
  if (!answer) throw new Error('Answer is required');
  if (longitude === undefined || latitude === undefined) {
    throw new Error('Longitude and latitude are required');
  }
  if (!userId) throw new Error('Unauthorized: User ID missing');

  const quizResult = await db.get({
    Key: { PK: `QUIZ#${quizId}`, SK: `QUIZ#${quizId}` }
  });

  if (!quizResult.Item) throw new Error('Quiz not found');
  if (quizResult.Item.createdBy !== userId) {
    throw new Error('Unauthorized: You can only add questions to your own quizzes');
  }

  const questionId = uuidv4();
  const parsedLongitude = parseFloat(longitude);
  const parsedLatitude = parseFloat(latitude);

  await db.put({
    Item: {
      PK: `QUIZ#${quizId}`,
      SK: `QUESTION#${questionId}`,
      questionId,
      question,
      answer,
      longitude: parsedLongitude,
      latitude: parsedLatitude,
      createdAt: new Date().toISOString()
    }
  });

  return { 
    message: 'Question added successfully', 
    questionId, 
    question, 
    answer, 
    longitude: parsedLongitude, 
    latitude: parsedLatitude 
  };
};

export { getAllQuizzes, createQuiz, getUserIdFromToken, deleteQuiz, getQuizById, addQuestion };
