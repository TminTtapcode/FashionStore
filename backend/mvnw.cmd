@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    https://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM ----------------------------------------------------------------------------
@REM Maven Start Up Batch script
@REM
@REM Required ENV vars:
@REM JAVA_HOME - location of a JDK home dir
@REM
@REM Optional ENV vars
@REM MAVEN_BATCH_ECHO - set to 'on' to enable the echoing of the input commands
@REM MAVEN_BATCH_PAUSE - set to 'on' to wait at the end of the script
@REM MAVEN_OPTS - parameters to passed to the Java VM when running Maven
@REM     e.g. to debug Maven itself, use
@REM set MAVEN_OPTS=-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=y,address=8000
@REM MAVEN_SKIP_RC - flag to disable loading of mavenrc files
@REM ----------------------------------------------------------------------------

@REM Begin all REM lines with '@' in case MAVEN_BATCH_ECHO is 'on'
@echo off
@setlocal

set ERROR_CODE=0

@REM set %HOME% to equivalent of $HOME
if "%HOME%" == "" (set "HOME=%HOMEDRIVE%%HOMEPATH%")

@REM If a script called %HOME%\mavenrc_pre.bat exists, source it.
if exist "%HOME%\mavenrc_pre.bat" call "%HOME%\mavenrc_pre.bat"

if "%MAVEN_NAME%" == "" (
  set MAVEN_NAME=Maven
)

@REM Find the project root directory
set MAVEN_PROJECTBASEDIR=%~dp0
:strip_slash
if "%MAVEN_PROJECTBASEDIR:~-1%"=="" goto end_strip
if "%MAVEN_PROJECTBASEDIR:~-1%"=="\" (
  set MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%
  goto strip_slash
)
:end_strip

set WRAPPER_JAR="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
set WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

set WRAPPER_URL=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar

@REM Check if wrapper jar exists, download if not
if not exist %WRAPPER_JAR% (
    echo Couldn't find %WRAPPER_JAR%, downloading it ...
    echo Downloading from: %WRAPPER_URL%
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('%WRAPPER_URL%', '%WRAPPER_JAR%')}"
)

if not exist "%JAVA_HOME%\bin\java.exe" (
  set JAVACMD=java
) else (
  set JAVACMD="%JAVA_HOME%\bin\java.exe"
)

%JAVACMD% %MAVEN_OPTS% -Dmaven.multiModuleProjectDirectory="%MAVEN_PROJECTBASEDIR%" -cp %WRAPPER_JAR% %WRAPPER_LAUNCHER% %*
if ERRORLEVEL 1 goto error
goto end

:error
set ERROR_CODE=1

:end
@endlocal & set ERROR_CODE=%ERROR_CODE%
exit /B %ERROR_CODE%
