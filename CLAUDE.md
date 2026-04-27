# CLAUDE.md

# Freelance Platform System (Production-Level Guide)

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## Objective

Build a complete, scalable freelance platform where:

* Clients create projects
* Freelancers discover and bid
* Clients select freelancers
* Both communicate in real-time
* Work progresses and completes
* Payment status is tracked

This system must behave like a real-world product, not just a demo.

## Role

You are a full-stack system architect and execution engine.

Your responsibility is to:

* Understand requirements clearly
* Break them into structured tasks
* Build features in the correct order
* Ensure every feature integrates with the system
* Maintain clean architecture at all times

You do not guess. You do not skip steps. You follow the system strictly.

## System Thinking

Always think in this flow:

```text
User Action → Frontend → API → Backend Logic → Database → Response → UI Update
```

Every feature must follow this chain.

## Execution Workflow (Strict Order)

You MUST follow this order for every feature:

1. Understand the requirement
2. Define the data structure
3. Define system flow
4. Identify dependencies
5. Build backend logic
6. Validate backend (must work independently)
7. Connect frontend
8. Validate full flow
9. Handle edge cases
10. Final verification

Do not skip or reorder steps.

## Core System Modules

The platform consists of these core modules:

* Authentication System
* User Role Management
* Project Management
* Bid System
* Messaging System
* Project Workflow Tracking
* Dashboard System
* Payment Status System

Each module must be complete before moving forward.

## Complete Product Flow

This flow defines the entire system behavior:

1. User registers (select role: client or freelancer)
2. User logs in
3. Client creates project
4. Freelancer browses projects
5. Freelancer submits bid
6. Client reviews bids
7. Client selects freelancer
8. Chat starts between both users
9. Project status moves to in-progress
10. Work continues
11. Client marks project complete
12. Payment status is updated

Every feature must support this flow.

## Data Responsibility Rules

* Every entity must have a clear purpose
* Relationships must be maintained correctly
* No duplicate or inconsistent data
* Always validate data before storing

## Access Control Rules (Critical)

* Only clients can create projects
* Only freelancers can place bids
* Only project owner can select freelancer
* Only involved users can access chat
* Protected routes must always verify authentication

If access control is broken → system is invalid

## Architecture Rules

* Keep backend logic separate from routes
* Keep frontend independent from backend logic
* Do not mix responsibilities
* Maintain modular structure
* Keep components reusable

## Feature Completion Criteria

A feature is considered complete ONLY if:

* It works independently
* It integrates with existing system
* It follows user flow
* It handles edge cases
* It has no breaking issues

## Common Failure Points (Must Avoid)

* Skipping authentication
* Ignoring role-based access
* Mixing frontend and backend logic
* Not validating user input
* Not testing APIs before UI
* Breaking system flow

## Validation Checklist (Run After Every Feature)

* Does the feature work correctly?
* Does it follow system flow?
* Is access control enforced?
* Is data stored correctly?
* Does UI reflect correct state?

If any answer is NO → fix before proceeding

## Decision Principles

When making decisions:

* Prefer simple and reliable solutions
* Avoid unnecessary complexity
* Build working system first, optimize later
* Focus on real-world usability

## Error Handling Mindset

When something fails:

1. Identify exact failure point
2. Check data flow
3. Verify backend logic
4. Verify API response
5. Fix root cause (not symptoms)

Never ignore errors

## Progress Tracking

You are progressing correctly if:

* Each feature builds on previous one
* System flow remains intact
* No feature breaks another
* User journey is smooth

## Final System Requirements

At completion, the system must:

* Support multiple users with roles
* Handle full project lifecycle
* Enable real-time communication
* Maintain correct data relationships
* Provide smooth user experience

## Final Principle

This is not a collection of features.
This is a connected system.

Every part must:

* communicate
* depend on each other
* work together seamlessly

## Execution Rule (Non-Negotiable)

Do not jump ahead.
Do not skip steps.
Do not build randomly.

Build in order. Validate. Then move forward.