#!/usr/bin/env bash

python manage.py collectstatic --noinput
gunicorn final_homework.wsgi:application
