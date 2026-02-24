import { FastifyRequest } from 'fastify';
export const checkInternalToken = async (request: FastifyRequest, reply) => {
   const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized: Missing or invalid token' });
  }
    const token = authHeader.split(' ')[1];

  if (token !== process.env.INTERNAL_SERVICE_KEY) {
    return reply.status(403).send({ error: 'Invalid internal service key' });
  }
}

