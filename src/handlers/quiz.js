import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import { getAllQuizzes, createQuiz, getUserIdFromToken, deleteQuiz, getQuizById, addQuestion } from '../services/quizService.js';

const createResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body)
});

const getStatusCode = (errorMessage) => {
  if (errorMessage.includes('not found')) return 404;
  if (errorMessage.includes('Unauthorized')) return 403;
  if (errorMessage.includes('required')) return 400;
  return 500;
};

const withAuth = (handler) => async (event) => {
  const userId = getUserIdFromToken(event);
  if (!userId) {
    return createResponse(401, { message: 'Unauthorized: Missing or invalid token' });
  }
  return handler(event, userId);
};

const getAllQuizzesHandler = async (event) => {
  try {
    const quizzes = await getAllQuizzes();
    return createResponse(200, { quizzes });
  } catch (error) {
    console.error('Error in handleGetAllQuizzes:', error);
    return createResponse(500, { message: 'Could not get quizzes', error: error.message });
  }
};

const createQuizHandler = withAuth(async (event, userId) => {
  const { name, description } = event.body;

  try {
    const result = await createQuiz(name, description, userId);
    return createResponse(201, result);
  } catch (error) {
    console.error('Error in handleCreateQuiz:', error);
    return createResponse(getStatusCode(error.message), { message: error.message || 'Could not create quiz' });
  }
});

const getQuizByIdHandler = async (event) => {
  const { quizId } = event.pathParameters;

  try {
    const quiz = await getQuizById(quizId);
    return createResponse(200, quiz);
  } catch (error) {
    console.error('Error in handleGetQuizById:', error);
    return createResponse(getStatusCode(error.message), { message: error.message || 'Could not retrieve quiz' });
  }
};

const deleteQuizHandler = withAuth(async (event, userId) => {
  const { quizId } = event.pathParameters;

  try {
    const result = await deleteQuiz(quizId, userId);
    return createResponse(200, result);
  } catch (error) {
    console.error('Error in handleDeleteQuiz:', error);
    return createResponse(getStatusCode(error.message), { message: error.message || 'Could not delete quiz' });
  }
});

const addQuestionHandler = withAuth(async (event, userId) => {
  const { quizId } = event.pathParameters;
  const { question, answer, longitude, latitude } = event.body;

  try {
    const result = await addQuestion(quizId, question, answer, longitude, latitude, userId);
    return createResponse(201, result);
  } catch (error) {
    console.error('Error in handleAddQuestion:', error);
    return createResponse(getStatusCode(error.message), { message: error.message || 'Could not add question' });
  }
});

export const handleGetAllQuizzes = middy(getAllQuizzesHandler)
  .use(cors())
  .use(httpErrorHandler());

export const handleCreateQuiz = middy(createQuizHandler)
  .use(jsonBodyParser())
  .use(cors())
  .use(httpErrorHandler());

export const handleGetQuizById = middy(getQuizByIdHandler)
  .use(cors())
  .use(httpErrorHandler());

export const handleDeleteQuiz = middy(deleteQuizHandler)
  .use(cors())
  .use(httpErrorHandler());

export const handleAddQuestion = middy(addQuestionHandler)
  .use(jsonBodyParser())
  .use(cors())
  .use(httpErrorHandler());
