import jwt from 'jsonwebtoken';

const authMiddleware = () => ({
  before: async (request) => {
    try {
      const authHeader = request.event.headers.Authorization || request.event.headers.authorization;
      if (!authHeader) {
        throw new Error('Unauthorized: Missing token');
      }
      
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      request.event.userId = decoded.userId;
    } catch (error) {
      const response = {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Unauthorized: Invalid token' })
      };
      return response;
    }
  }
});

export default authMiddleware;
