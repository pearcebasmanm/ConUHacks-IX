# Focus Content Extractor 1.0

## Current Version:
-extracts web content
-parses web content to LLM API to check if it is within "focus topics" (user can preset these topics)


## Build instructions:
- You need to have node installed preferably a version >= 20.11.1.
- In the project root that is /CONUHACKS-IX run the command `npm install` to install all the dependencies for the project. This will create a node_modules folder in the repo root.
- To build the project run the command `npm run build`. This will output the files in the `dist` in the project root.

## To setup:
- build the project
- go to chrome://extensions
- go on developer mode (top right)
- click "Load unpacked"
- navigate to this project folder
- upload `dist` after the building the project
- The extension should be available for your testing now.
