const json = (description, example) => ({
  description,
  content: {
    'application/json': { example }
  }
});

const requestBody = example => ({
  required: true,
  content: {
    'application/json': { example }
  }
});

const authSecurity = [
  { cookieAuth: [] },
  { bearerAuth: [] }
];

const unauthorized = json('Authentication required', {
  error: 'Autentikasi diperlukan.',
  code: 'UNAUTHORIZED'
});

const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'NovaMind Hub API',
    version: '1.0.0',
    description: 'Backend API for NovaMind authentication, users, AI chat, achievements, statistics, and administration.'
  },
  servers: [{ url: '/', description: 'Current deployment' }],
  tags: [
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Chat' },
    { name: 'Achievements' },
    { name: 'Statistics' },
    { name: 'Admin' },
    { name: 'System' }
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'novamind_access_token'
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['error', 'code'],
        properties: {
          error: { type: 'string' },
          code: { type: 'string' }
        }
      }
    }
  },
  paths: {
    '/api/csrf-token': {
      get: {
        tags: ['Auth'],
        summary: 'Get a CSRF token for subsequent mutation requests',
        description: 'Sets a Strict HttpOnly cookie and returns the token value. The token MUST be passed in the `X-CSRF-Token` header for all POST, PUT, PATCH, DELETE requests.',
        responses: {
          200: json('CSRF Token generated', {
            success: true,
            token: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
          })
        }
      }
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register with Supabase Auth',
        requestBody: requestBody({
          fullname: 'Alya Innovator',
          email: 'alya@example.com',
          password: 'strong-password-123',
          remember: true
        }),
        responses: {
          201: json('Account created', {
            emailVerificationRequired: true,
            session: null,
            user: {
              id: '71c9ecbe-20fb-4e83-91be-52bfde156789',
              fullname: 'Alya Innovator',
              email: 'alya@example.com',
              role: 'participant'
            }
          }),
          400: json('Invalid input', {
            error: 'Alamat email tidak valid.',
            code: 'VALIDATION_ERROR'
          })
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and create an HttpOnly cookie session',
        requestBody: requestBody({
          email: 'alya@example.com',
          password: 'strong-password-123',
          remember: true
        }),
        responses: {
          200: json('Authenticated', {
            auth: {
              id: 'c6674d70-5337-45ee-b9af-9ae49f35dfde',
              email: 'alya@example.com',
              emailVerified: true
            },
            session: {
              expiresAt: 1783228800,
              remember: true,
              tokenType: 'bearer'
            },
            user: {
              id: '71c9ecbe-20fb-4e83-91be-52bfde156789',
              fullname: 'Alya Innovator',
              totalChat: 10,
              totalLogin: 4
            }
          }),
          401: json('Invalid credentials', {
            error: 'Email atau password salah.',
            code: 'INVALID_CREDENTIALS'
          })
        }
      }
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Revoke and clear the current session',
        responses: {
          204: { description: 'Logged out' }
        }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Read the authenticated session',
        security: authSecurity,
        responses: {
          200: json('Current user', {
            auth: {
              id: 'c6674d70-5337-45ee-b9af-9ae49f35dfde',
              email: 'alya@example.com',
              emailVerified: true
            },
            session: { authenticated: true, remember: true },
            user: {
              id: '71c9ecbe-20fb-4e83-91be-52bfde156789',
              fullname: 'Alya Innovator',
              role: 'participant'
            }
          }),
          401: unauthorized
        }
      }
    },
    '/api/auth/verify-email': {
      post: {
        tags: ['Auth'],
        summary: 'Verify an email OTP or token hash',
        requestBody: requestBody({
          email: 'alya@example.com',
          token: '123456',
          remember: true
        }),
        responses: {
          200: json('Email verified', {
            auth: { email: 'alya@example.com', emailVerified: true },
            session: { remember: true, tokenType: 'bearer' }
          }),
          400: json('Invalid token', {
            error: 'Verifikasi email gagal.',
            code: 'OTP_EXPIRED'
          })
        }
      }
    },
    '/api/auth/resend-verification': {
      post: {
        tags: ['Auth'],
        summary: 'Resend signup verification',
        requestBody: requestBody({ email: 'alya@example.com' }),
        responses: {
          202: json('Request accepted', {
            message: 'Jika akun tersedia, email verifikasi akan dikirim.'
          })
        }
      }
    },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Send a password recovery email',
        requestBody: requestBody({ email: 'alya@example.com' }),
        responses: {
          202: json('Request accepted', {
            message: 'Jika akun tersedia, instruksi reset password akan dikirim.'
          })
        }
      }
    },
    '/api/auth/verify-recovery': {
      post: {
        tags: ['Auth'],
        summary: 'Exchange a recovery OTP for a session',
        requestBody: requestBody({
          email: 'alya@example.com',
          token: '123456',
          remember: false
        }),
        responses: {
          200: json('Recovery session created', {
            session: { remember: false, tokenType: 'bearer' },
            user: { id: '71c9ecbe-20fb-4e83-91be-52bfde156789' }
          })
        }
      }
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Set a new password',
        security: authSecurity,
        requestBody: requestBody({ password: 'new-strong-password-123' }),
        responses: {
          200: json('Password updated', {
            message: 'Password berhasil diperbarui.'
          }),
          401: unauthorized
        }
      }
    },
    '/api/users/profile': {
      get: {
        tags: ['Users'],
        summary: 'Read the authenticated database profile',
        security: authSecurity,
        responses: {
          200: json('Profile', {
            registration: null,
            user: {
              id: '71c9ecbe-20fb-4e83-91be-52bfde156789',
              fullname: 'Alya Innovator',
              email: 'alya@example.com',
              avatar: null,
              role: 'participant',
              lastLoginAt: '2026-07-05T03:00:00.000Z',
              totalChat: 10,
              totalLogin: 4,
              createdAt: '2026-07-01T03:00:00.000Z'
            }
          }),
          401: unauthorized
        }
      },
      put: {
        tags: ['Users'],
        summary: 'Update the authenticated profile',
        security: authSecurity,
        requestBody: requestBody({
          fullname: 'Alya Nova',
          avatar: 'https://example.com/avatar.png'
        }),
        responses: {
          200: json('Profile updated', {
            emailVerificationRequired: false,
            user: {
              id: '71c9ecbe-20fb-4e83-91be-52bfde156789',
              fullname: 'Alya Nova'
            }
          }),
          401: unauthorized
        }
      }
    },
    '/api/users': {
      post: {
        tags: ['Users'],
        summary: 'Create a legacy competition profile',
        deprecated: true,
        requestBody: requestBody({
          fullname: 'Alya Innovator',
          email: 'alya@example.com',
          phone: '081234567890',
          university: 'Universitas Indonesia',
          faculty: 'Teknik',
          teamName: 'Nova Team',
          category: 'dynamic'
        }),
        responses: {
          201: json('Profile created', {
            user: {
              id: '71c9ecbe-20fb-4e83-91be-52bfde156789',
              fullname: 'Alya Innovator',
              email: 'alya@example.com'
            },
            registration: {
              teamName: 'Nova Team',
              category: 'dynamic'
            }
          })
        }
      }
    },
    '/api/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Read the current profile (legacy-compatible alias)',
        security: authSecurity,
        responses: {
          200: json('Current profile', {
            user: {
              id: '71c9ecbe-20fb-4e83-91be-52bfde156789',
              fullname: 'Alya Innovator'
            },
            registration: null
          }),
          401: unauthorized
        }
      }
    },
    '/api/users/statistics': {
      get: {
        tags: ['Statistics'],
        summary: 'Read authenticated user statistics',
        security: authSecurity,
        responses: {
          200: json('User statistics', {
            data: {
              totalChat: 10,
              totalAchievement: 2,
              lastLoginAt: '2026-07-05T03:00:00.000Z',
              accountCreatedAt: '2026-07-01T03:00:00.000Z',
              dailyActivity: [
                { date: '2026-07-05', totalChat: 3 }
              ]
            }
          }),
          401: unauthorized
        }
      }
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Read the owned user record',
        security: authSecurity,
        parameters: [{
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        }],
        responses: {
          200: json('User record', {
            user: { id: '71c9ecbe-20fb-4e83-91be-52bfde156789' },
            registration: null
          }),
          403: json('Not the owner', {
            error: 'Anda tidak memiliki izin untuk mengakses data ini.',
            code: 'FORBIDDEN'
          })
        }
      },
      put: {
        tags: ['Users'],
        summary: 'Update the owned user record',
        security: authSecurity,
        parameters: [{
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        }],
        requestBody: requestBody({ fullname: 'Alya Nova' }),
        responses: {
          200: json('User updated', {
            emailVerificationRequired: false,
            user: { fullname: 'Alya Nova' }
          })
        }
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete the owned Supabase Auth account and profile',
        security: authSecurity,
        parameters: [{
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        }],
        responses: {
          204: { description: 'User deleted' }
        }
      }
    },
    '/api/chat': {
      post: {
        tags: ['Chat'],
        summary: 'Ask the AI and persist prompt/response',
        security: authSecurity,
        requestBody: requestBody({
          message: 'Bagaimana memvalidasi ide inovasi?'
        }),
        responses: {
          201: json('Chat created', {
            answer: 'Mulailah dengan wawancara pengguna dan eksperimen kecil.',
            chat: {
              id: '5e0ea1b6-4197-42d1-961c-75ff8f3497cd',
              prompt: 'Bagaimana memvalidasi ide inovasi?',
              response: 'Mulailah dengan wawancara pengguna dan eksperimen kecil.',
              createdAt: '2026-07-05T03:00:00.000Z'
            }
          }),
          401: unauthorized
        }
      }
    },
    '/api/chat/history': {
      get: {
        tags: ['Chat'],
        summary: 'Read owned chat history',
        security: authSecurity,
        parameters: [{
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 }
        }],
        responses: {
          200: json('Chat history', {
            chats: [{
              id: '5e0ea1b6-4197-42d1-961c-75ff8f3497cd',
              prompt: 'Bagaimana memvalidasi ide?',
              response: 'Mulai dengan riset pengguna.',
              createdAt: '2026-07-05T03:00:00.000Z'
            }]
          }),
          401: unauthorized
        }
      },
      delete: {
        tags: ['Chat'],
        summary: 'Delete all owned chat history',
        security: authSecurity,
        responses: {
          204: { description: 'History deleted' },
          401: unauthorized
        }
      }
    },
    '/api/chat/{id}': {
      delete: {
        tags: ['Chat'],
        summary: 'Delete one owned chat',
        security: authSecurity,
        parameters: [{
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        }],
        responses: {
          204: { description: 'Chat deleted' },
          404: json('Chat not found', {
            error: 'Chat tidak ditemukan.',
            code: 'NOT_FOUND'
          })
        }
      }
    },
    '/api/chat-history': {
      get: {
        tags: ['Chat'],
        summary: 'Legacy alias for GET /api/chat/history',
        deprecated: true,
        security: authSecurity,
        responses: {
          200: json('Chat history', {
            chats: [{
              id: '5e0ea1b6-4197-42d1-961c-75ff8f3497cd',
              prompt: 'Bagaimana memvalidasi ide?',
              response: 'Mulai dengan riset pengguna.'
            }]
          }),
          401: unauthorized
        }
      }
    },
    '/api/achievements': {
      get: {
        tags: ['Achievements'],
        summary: 'List earned achievements',
        security: authSecurity,
        responses: {
          200: json('Achievements', {
            data: [{
              code: 'first_chat',
              name: 'First Chat',
              description: 'Mengirim percakapan pertama dengan NovaMind AI.',
              earnedAt: '2026-07-05T03:00:00.000Z'
            }]
          }),
          401: unauthorized
        }
      }
    },
    '/api/achievements/check': {
      post: {
        tags: ['Achievements'],
        summary: 'Evaluate and award all eligible achievements',
        security: authSecurity,
        responses: {
          200: json('Achievements checked', {
            data: [{
              code: 'first_login',
              name: 'First Login',
              earnedAt: '2026-07-05T03:00:00.000Z'
            }],
            checkedAt: '2026-07-05T03:00:00.000Z'
          }),
          401: unauthorized
        }
      }
    },
    '/api/admin/statistics': {
      get: {
        tags: ['Admin'],
        summary: 'Read global platform statistics',
        security: authSecurity,
        responses: {
          200: json('Admin statistics', {
            data: {
              totalUsers: 120,
              totalChats: 864,
              totalLogins: 452,
              totalChatsToday: 37,
              recentUsers: [],
              recentChats: []
            }
          }),
          403: json('Admin only', {
            error: 'Endpoint ini hanya dapat diakses admin.',
            code: 'FORBIDDEN'
          })
        }
      }
    },
    '/api/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List newest users',
        security: authSecurity,
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
        ],
        responses: {
          200: json('Users', {
            data: [{
              id: '71c9ecbe-20fb-4e83-91be-52bfde156789',
              fullname: 'Alya Innovator',
              role: 'participant',
              totalChat: 10,
              totalLogin: 4
            }],
            pagination: { limit: 20, offset: 0, total: 120 }
          }),
          403: json('Admin only', {
            error: 'Endpoint ini hanya dapat diakses admin.',
            code: 'FORBIDDEN'
          })
        }
      }
    },
    '/api/admin/chats': {
      get: {
        tags: ['Admin'],
        summary: 'List newest chats',
        security: authSecurity,
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
        ],
        responses: {
          200: json('Chats', {
            data: [{
              id: '5e0ea1b6-4197-42d1-961c-75ff8f3497cd',
              prompt: 'Bagaimana memvalidasi ide?',
              response: 'Mulai dengan riset pengguna.',
              user: {
                id: '71c9ecbe-20fb-4e83-91be-52bfde156789',
                fullname: 'Alya Innovator',
                email: 'alya@example.com'
              }
            }],
            pagination: { limit: 20, offset: 0, total: 864 }
          }),
          403: json('Admin only', {
            error: 'Endpoint ini hanya dapat diakses admin.',
            code: 'FORBIDDEN'
          })
        }
      }
    },
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Liveness check',
        responses: {
          200: json('Alive', {
            status: 'ok',
            aiConfigured: true,
            authConfigured: true,
            databaseConfigured: true
          })
        }
      }
    },
    '/api/ready': {
      get: {
        tags: ['System'],
        summary: 'Dependency readiness check',
        responses: {
          200: json('Ready', {
            status: 'ready',
            checks: { auth: true, database: true },
            aiConfigured: true
          }),
          503: json('Not ready', {
            status: 'not_ready',
            checks: { auth: true, database: false },
            aiConfigured: false
          })
        }
      }
    }
  }
};

module.exports = { openApiDocument };
