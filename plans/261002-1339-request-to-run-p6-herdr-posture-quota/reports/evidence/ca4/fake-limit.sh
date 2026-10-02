#!/bin/bash
# Test-only stand-in for an agent that has hit its provider usage limit: prints the limit screen and idles.
clear
printf '\n  Claude usage limit reached.\n  You have hit your usage limit. Try again in 3 hours (resets 11:00pm).\n\n  [fake screen for acceptance case 4 -- not a real provider limit]\n\n'
exec sleep 3600
