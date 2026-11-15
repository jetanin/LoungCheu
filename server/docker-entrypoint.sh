#!/bin/sh
set -eu
# Migrations and seeding are separate jobs, never an application startup side effect.
exec "$@"
