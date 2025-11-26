cd /d "D:\Python\Joplin"
python "onedrive.py"
set "SRC=%USERPROFILE%\.config\joplin-desktop\database.sqlite"
set "DEST_DIR=D:\Python\Joplin"
copy /Y "%SRC%" "%DEST_DIR%\joplin_db.sqlite"
python "mongodb_sync.py"
pause