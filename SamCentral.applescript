-- Sam Central Launcher AppleScript
-- Save this as an Application in Script Editor

set appDir to do shell script "find $HOME -name 'sam-central-app' -type d 2>/dev/null | head -1"

if appDir is "" then
    display alert "Sam Central" message "Cannot find sam-central-app folder. Make sure Agent Zero Docker is running." as warning
    return
end if

do shell script "cd " & quoted form of appDir & " && export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH && [ ! -d node_modules ] && npm install; npm start &"

display notification "Sam Central starting..." with title "Sam Central" subtitle "Check your menu bar in 5 seconds"
