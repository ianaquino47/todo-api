import { z } from 'zod';

export const AddTodoSchema = {
  title: z.string().min(1).describe('The title of the TODO item to create'),
};

export const UpdateTodoSchema = {
  id: z.string().describe('The ID of the TODO item to update'),
  title: z.string().min(1).describe('The new title for the TODO item'),
};

export const CompleteTodoSchema = {
  id: z.string().describe('The ID of the TODO item to mark as completed'),
};

export const DeleteTodoSchema = {
  id: z.string().describe('The ID of the TODO item to delete'),
};
