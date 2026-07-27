import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { validateBody } from '../../shared/utils/validation.js';
import { resetPasswordSchema } from '../../core/application/dtos/auth.dto.js';
import { AuthService } from '../../core/application/services/AuthService.js';
import { DynamoUserRepository } from '../../core/infrastructure/repositories/UserRepository.js';
import { DynamoAuditRepository } from '../../core/infrastructure/repositories/index.js';

const authService = new AuthService(
  new DynamoUserRepository(),
  new DynamoAuditRepository(),
);

export const handler = createHandler(
  async ({ event, requestId }) => {
    const dto = validateBody(resetPasswordSchema, event.body);
    const result = await authService.resetPassword(dto);
    return successResponse(result, 200, requestId);
  },
  { requireAuth: false },
);
