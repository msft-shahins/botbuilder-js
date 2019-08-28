To build and run `CLDialog` sample follow instructions below: 

### Build

* Install lerna and typescript@3.1.6 
```
npm install -g lerna typescript@3.1.6
```
* Run ```lerna bootstrap``` in the root of repo
* Run ``` npm install ``` to setup all dependencies 
* Run ``` npm run build ``` to build all libraries and samples

### Run sample

* Configure [`CLOptions`](https://github.com/msft-shahins/botbuilder-js/blob/e427123a609379db5eba78efbb2d2e014686019f/samples/CL-Dialog/src/index.ts#L41) with your `LUIS_AUTHORING_KEY`
* Configure CLDialog the [CL model Id](https://github.com/msft-shahins/botbuilder-js/blob/e427123a609379db5eba78efbb2d2e014686019f/samples/CL-Dialog/src/index.ts#L48) you want to use. For example, this can be the model ID of the imported sample name-color.cl model. 
* Run ```tsc``` to build updated bot 
* Run ```npm start``` to run the sample bot and use emulator to send messages to bot. 


