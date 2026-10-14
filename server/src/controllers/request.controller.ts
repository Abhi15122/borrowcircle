import type { Request, Response } from 'express';
import {
  idSchema,
  borrowSchema,
  requestQuerySchema,
  actionParamsSchema,
  emptySchema,
} from '@borrowcircle/shared';
import * as requests from '../services/request.service.js';
import { authenticatedId, parseInput } from '../validation/request.js';
export async function create(request: Request, response: Response) {
  response
    .status(201)
    .json(
      await requests.createRequest(
        parseInput(idSchema, request.params).id,
        parseInput(borrowSchema, request.body),
        authenticatedId(request),
      ),
    );
}
export async function list(request: Request, response: Response) {
  response.json(
    await requests.listRequests(
      parseInput(requestQuerySchema, request.query),
      authenticatedId(request),
    ),
  );
}
export async function action(request: Request, response: Response) {
  const params = parseInput(actionParamsSchema, request.params);
  parseInput(emptySchema, request.body ?? {});
  response.json(await requests.actOnRequest(params.id, params.action, authenticatedId(request)));
}
