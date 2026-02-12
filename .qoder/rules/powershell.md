---
trigger: always_on
---
Use powershell commands instead of bash.

## PowerShell Commands Reference

### Navigation
- `cd <path>` - Change directory
- `cd ..` - Go up one directory
- `Get-Location` or `pwd` - Show current directory
- `ls` or `Get-ChildItem` - List files and directories

### File Operations
- `New-Item -ItemType File -Name <filename>` - Create new file
- `New-Item -ItemType Directory -Name <dirname>` - Create new directory
- `Remove-Item <path>` - Delete file or directory
- `Copy-Item <source> <destination>` - Copy files
- `Move-Item <source> <destination>` - Move files

### Process Management
- `Get-Process` - List running processes
- `Stop-Process -Name <process>` - Kill a process

### Environment
- `$env:PATH` - View PATH environment variable
- `[Environment]::GetEnvironmentVariable("VARNAME")` - Get environment variable

### Common Aliases
- `cat` = `Get-Content`
- `rm` = `Remove-Item`
- `cp` = `Copy-Item`
- `mv` = `Move-Item`
- `mkdir` = `New-Item -ItemType Directory`
