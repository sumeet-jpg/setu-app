// @ts-nocheck
import { NextResponse } from 'next/server'

const spec = {
  openapi: '3.1.0',
  info: {
    title: 'Setu AI Employees',
    description: 'Browse and hire AI Employees that command fleets of specialized agents. 100 employees across WhatsApp, E-commerce, Sales, Marketing, Finance, RevOps, Healthcare, Education, Real Estate, HR, IT, Operations, and C-Suite.',
    version: '1.0.0',
    contact: { name: 'Sumeet', email: 'sumeet@setuagents.com', url: 'https://setuagents.com' },
  },
  servers: [{ url: 'https://setuagents.com', description: 'Production' }],
  paths: {
    '/api/employees': {
      get: {
        operationId: 'listEmployees',
        summary: 'List all AI Employees',
        description: 'Returns all 100 AI Employees with name, role, department, agent count, and pricing.',
        parameters: [
          { name: 'dept', in: 'query', description: 'Filter by department', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'List of AI Employees',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/EmployeeSummary' },
                },
              },
            },
          },
        },
      },
    },
    '/api/employees/{slug}': {
      get: {
        operationId: 'getEmployee',
        summary: 'Get full employee profile',
        description: 'Returns complete profile including capabilities, tools, how-it-works, and pricing for a specific AI Employee.',
        parameters: [
          { name: 'slug', in: 'path', required: true, description: 'Employee slug (e.g. marketing-manager)', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Employee profile' },
          '404': { description: 'Employee not found' },
        },
      },
    },
    '/api/employees/hire': {
      post: {
        operationId: 'hireEmployee',
        summary: 'Submit a hire request',
        description: 'Submit a hire request for an AI Employee. Triggers admin notification and prospect confirmation email.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/HireRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Hire request submitted successfully' },
          '400': { description: 'Missing required fields' },
        },
      },
    },
  },
  components: {
    schemas: {
      EmployeeSummary: {
        type: 'object',
        properties: {
          slug: { type: 'string', example: 'marketing-manager' },
          name: { type: 'string', example: 'Marcus' },
          title: { type: 'string', example: 'Marketing Manager' },
          dept: { type: 'string', example: 'Marketing' },
          emoji: { type: 'string', example: '📣' },
          tagline: { type: 'string' },
          agentCount: { type: 'number', example: 208 },
          pricing: {
            type: 'object',
            properties: {
              monthly: { type: 'number', example: 1999 },
              label: { type: 'string', example: '$1,999/mo' },
            },
          },
        },
      },
      HireRequest: {
        type: 'object',
        required: ['name', 'email', 'company', 'use_case', 'employee_slug'],
        properties: {
          name: { type: 'string', description: 'Your full name' },
          email: { type: 'string', format: 'email' },
          company: { type: 'string' },
          role: { type: 'string', description: 'Your role at the company' },
          size: { type: 'string', description: 'Company size (e.g. 11-50)' },
          use_case: { type: 'string', description: 'What the employee will handle for you' },
          timeline: { type: 'string', description: 'When you want to go live' },
          employee_slug: { type: 'string', description: 'Which employee to hire (e.g. marketing-manager)' },
          employee_name: { type: 'string' },
          employee_title: { type: 'string' },
        },
      },
    },
  },
}

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
