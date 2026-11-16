import type { Response } from "express";

export type DefaultResponse<T> = {
  success: boolean;
  statusCode: number;
  data?: T;
  error?: string;
  message?: string;
};

export function createSuccess<T>(data: T, statusCode = 200, message?: string): DefaultResponse<T> {
  return { success: true, statusCode, data, ...(message && { message }) };
}

export function createError(error: string, statusCode = 500): DefaultResponse<never> {
  return { success: false, statusCode, error };
}

export function sendResponse<T>(res: Response, response: DefaultResponse<T>): Response {
  return res.status(response.statusCode).json(response);
}

export function ok<T = never>(message = "Requisição realizada com sucesso", data?: T): DefaultResponse<T> {
  return { success: true, statusCode: 200, message, ...(data !== undefined && { data }) };
}

export function created<T = never>(message = "Recurso criado com sucesso", data?: T): DefaultResponse<T> {
  return { success: true, statusCode: 201, message, ...(data !== undefined && { data }) };
}

export function updated<T = never>(message = "Recurso atualizado com sucesso", data?: T): DefaultResponse<T> {
  return { success: true, statusCode: 200, message, ...(data !== undefined && { data }) };
}

export function deleted<T = never>(message = "Recurso removido com sucesso", data?: T): DefaultResponse<T> {
  return { success: true, statusCode: 200, message, ...(data !== undefined && { data }) };
}

export function badRequest(message = "Dados inválidos ou incompletos"): DefaultResponse<never> {
  return createError(message, 400);
}

export function notFound(message = "Registro não encontrado"): DefaultResponse<never> {
  return createError(message, 404);
}

export function conflict(message = "Conflito de dados"): DefaultResponse<never> {
  return createError(message, 409);
}

export function internalError(message = "Erro interno no servidor"): DefaultResponse<never> {
  return createError(message, 500);
}