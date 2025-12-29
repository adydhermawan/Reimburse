#!/bin/bash
echo "Starting installation..." > install_log.txt
npm install axios expo-secure-store expo-sharing 2>> install_log.txt >> install_log.txt
echo "Installation complete. Exit code: $?" >> install_log.txt
ls -la node_modules/expo-sharing >> install_log.txt
