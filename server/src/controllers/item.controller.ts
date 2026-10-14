import type { Request, Response } from 'express';
import { idSchema, itemSchema, itemQuerySchema, emptySchema } from '@borrowcircle/shared';
import * as items from '../services/item.service.js';
import { authenticatedId, parseInput } from '../validation/request.js';
export async function list(request: Request, response: Response) {
  response.json(
    await items.listItems(parseInput(itemQuerySchema, request.query), request.session.userId),
  );
}
export async function detail(request: Request, response: Response) {
  response.json(await items.getItem(parseInput(idSchema, request.params).id));
}
export async function create(request: Request, response: Response) {
  response
    .status(201)
    .json(await items.createItem(parseInput(itemSchema, request.body), authenticatedId(request)));
}
export async function edit(request: Request, response: Response) {
  response.json(
    await items.editItem(
      parseInput(idSchema, request.params).id,
      parseInput(itemSchema, request.body),
      authenticatedId(request),
    ),
  );
}
export async function archive(request: Request, response: Response) {
  parseInput(emptySchema, request.body ?? {});
  await items.archiveItem(parseInput(idSchema, request.params).id, authenticatedId(request));
  response.status(204).end();
}
