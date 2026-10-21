# ADR 0003 — Two roles and a configurable publish gate

**Status:** Accepted · 2026-10-14

## Context

The owner writes and publishes. She has previously hired a second writer. She has not yet said whether that writer should be able to publish unreviewed.

## Decision

- Two roles on `users`: `admin` and `author`. Only admins can create users or change roles; authors can edit their own profile.
- Posts: anyone signed in can create; authors can update only posts they are listed on; only admins can delete.
- Authors can read published posts and their own drafts, not other writers' unpublished drafts. Media records its uploader; authors can only edit images they uploaded. Featured and Trending are admin-only on create and update. (Added 2026-10-21 after the principal review.)
- A Site Settings toggle, **Authors can publish without review** (default off), is enforced in a `beforeValidate` hook: an author saving with `_status = published` is rejected unless the toggle is on. Drafts are always allowed.

## Consequences

- Changing the workflow is a checkbox for the client, not a code change.
- Adding an `editor` role later (publish others' posts, no user management) is a one-line addition to the select and access helpers.
