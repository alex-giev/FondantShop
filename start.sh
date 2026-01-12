#!/bin/bash
cd src
exec gunicorn --bind 0.0.0.0:$PORT app:app
