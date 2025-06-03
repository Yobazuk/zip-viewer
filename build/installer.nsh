!macro customInstall
  ; Add registry keys for right-click menu
  WriteRegStr HKCR ".zip\shell\Open with ZIP Viewer" "" "Open with ZIP Viewer"
  WriteRegStr HKCR ".zip\shell\Open with ZIP Viewer\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'
  
  ; Add application to "Open with" list
  WriteRegStr HKLM "Software\Classes\Applications\${APP_EXECUTABLE_FILENAME}\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'
  WriteRegStr HKLM "Software\Classes\Applications\${APP_EXECUTABLE_FILENAME}\SupportedTypes" ".zip" ""
  
  ; Refresh shell icons
  System::Call 'shell32.dll::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'
!macroend

!macro customUnInstall
  ; Remove registry keys
  DeleteRegKey HKCR ".zip\shell\Open with ZIP Viewer"
  DeleteRegKey HKLM "Software\Classes\Applications\${APP_EXECUTABLE_FILENAME}"
  
  ; Refresh shell icons
  System::Call 'shell32.dll::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'
!macroend 