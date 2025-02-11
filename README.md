# ARXML Navigation Helper #

This extension provides easier navigation of Autosar XML files.
Also works for Autosar models split up into multiple files.

## Prerequesites ##

The language server used for resolving commands is Windows-x64 only at the moment.

For bigger files (>50MB) VSCode disables extensions. To get around this, the extension [Large file support for extensions](https://marketplace.visualstudio.com/items?itemName=mbehr1.vsc-lfs) is needed.

---------------

## Features ##

- **Tree view**: Shows the tree structure of shortname element, in what file they are located and makes navigating easy
- **Open in tree view**: Open the Tree View at your current location
- **Go to definition**: Jump to the corresponding SHORT-NAME element by clicking on the corresponding path part on a REF element
- **Go to references**: Show all REF elements that point to this SHORT-NAME element
- **Go to reference owner**: Jump to the parent shortname element that owns the given reference
- **Hover information**: Shows the full path of a given shortname, and other elements its referencing. These hovers can show how many references the element contains, and links to a list of them
- **Open models split up over multiple files**: By using "open folder", all .arxml files in that folder get parsed together into one model for references, treeView, navigation etc. Every feature works across files too. Important: to open multiple files as a single mode, use the open folder feature of VSCode, all the .arxml files need to be in this directory

---------------

## Useful Commands and Shortcuts ##

- **Ctrl + LeftClick** as a shortcut for **go to definition**
- **Alt + LeftArrow** return to your last position ("undo jump")
- **Inner parts** of REF elements can be jumped to individually (go to references works there too)
- The **Tree View** can be refreshed manually by clicking the arrow on the top right
- **Hovering** over an element in the Tree View shows you in what file the definition is located
- **References** can be set to either link directly to the reference element or the owning element in the settings

---------------

## Common issues ##

### Extension does not work on big files ###

For files bigger than around 50mb, Visual Studio Code disables all extensions automatically.
The current workaround for this is to use the VSCode extension
[Large file support for extensions](https://marketplace.visualstudio.com/items?itemName=mbehr1.vsc-lfs).
Install it and use to command (Ctrl+Shift+P) **open large file...**
This can currently only open the file in readonly mode.

### Loading takes very long ###

Files first have to be parsed by the extension.
This takes a couple of seconds for bigger files (around 5 seconds for 170MB for me).
Afterwards jumps should be almost instant.
Things can take a while to load, especially on bigger files because VSCode needs to load in all the surrounding areas for the references, the extension itself cannot speed that up.

## Backend/Developing ##

The [ARXML Language Server](https://github.com/JonasRock/ARXML_LanguageServer) serves as the backend using the language server protocol.
The server executable comes bundled with the extension. If you want to package the extension yourself, clone the repository, add the server executable to the root directory, named "ARXML_LanguageServer_Windows.exe" or "ARXML_LanguageServer_Linux", depending on operating system.