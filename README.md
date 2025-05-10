
# HTML OS

Welcome to **HTML OS**, a lightweight, browser-based operating system designed to simulate a desktop environment entirely in HTML, CSS, and JavaScript. This project is in its **first release**, and while it is still in its early stages, it already provides a functional and interactive experience for users who want to explore a web-based OS concept.

---

## 🚨 Still in release 1.0

HTML OS is still very new and please expect bugs, if you find bugs, please report the issue on the [GitHub Issues](https://github.com/IntellegixLabs/htmlos/issues) page.

## 🚀 Features

- **Desktop Environment**: A fully interactive desktop with draggable windows, a taskbar, and a start menu.
- **File System Simulation**: A virtual file system that allows you to create, edit, and manage files and folders.
- **Built-in Applications**:
  - **Text Editor**: Create and edit text files with the ability to save them into the `Documents` folder.
  - **App Maker**: Build custom apps, save them to the `Applications` folder, and even download them as `.js` files.
  - **File Explorer**: Navigate through the virtual file system and manage your files.
- **Customizable Themes**: Switch between light and dark themes for a personalized experience.
- **Dynamic Window Management**: Open, minimize, maximize, and close windows with ease.

---

## 📥 Installation

### Prerequisites
To run HTML OS, you need:
- A modern web browser (e.g., Chrome, Firefox, Edge, or Safari).
- No additional software is required—HTML OS runs entirely in your browser!

### Steps to Install
1. **Clone the Repository**:
   Open your terminal and run the following command to clone the project:
   ```bash
   git clone https://github.com/IntellegixLabs/htmlos.git
   ```
  

2. **Navigate to the Project Directory**:
   ```bash
   cd htmlos
   ```

3. **Open the Project in Your Browser**:
   Simply open the `htmlos-1.0.htm` file in your browser:
   - On macOS, you can use the `open` command:
     ```bash
     open htmlos-1.0.htm
     ```
   - Alternatively, drag and drop the `htmlos-1.0.htm` file into your browser.

4. **Start Exploring**:
   Once the project is loaded in your browser, you can start interacting with the desktop environment, opening apps, and managing files.

---

## Plugins
It is possible to install plugins for HTML OS, even if its custom made.
All you need to do is add snippnets of code into the `htmlos-1.0.htm` file:

`````html
<div id="YOUR_PLUGIN_NAME"></div>
<script>
        fetch('data.xml') // Load XML file
            .then(response => response.text())
            .then(xmlString => {
                let parser = new DOMParser();
                let xmlDoc = parser.parseFromString(xmlString, "application/xml");
                let content = xmlDoc.querySelector("content").textContent;
                document.getElementById("xmlContent").innerHTML = content;
            })
            .catch(error => console.error("Error loading XML:", error));
</script>

`````
If the plugin comes with an overlay, add this:
`````css
        .overlay {
            position: fixed;
            top: 20%;
            left: 30%;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
        }
`````
Change the CSS file however you want, if you know what you are doing.
Replace `YOUR_PLUGIN_NAME` with your actual plugin name.

## How to make a plugin
To make a plugin all you need is an XML file, it should look like this:
````xml
<?xml version="1.0" encoding="UTF-8"?>
<data>
    <content>
        <![CDATA[
            <div class="overlay">
                <h2>Hello from XML!</h2>
                <p>This content is loaded dynamically.</p>
            </div>
        ]]>
    </content>
</data>

````
Feel free to edit the provided scripts to match your requirements.
If you plugin has an overlay, please remember to add an `overlay` class like this

````html
<div class="overlay"></div>
````
Please note that making a HTML OS plugin requires general HTML and XML knowledge.
## 🛠️ Usage

### Desktop Environment
- **Start Menu**: Click the start menu icon in the bottom-left corner to access installed applications.
- **Taskbar**: View and manage open windows from the taskbar.
- **Draggable Windows**: Move windows around by dragging their headers.

### File System
- **File Explorer**: Open the file explorer to navigate through the virtual file system.
- **Documents Folder**: Save and manage your text files here.
- **Applications Folder**: Save custom apps created with the App Maker.

### Built-in Applications
1. **Text Editor**:
   - Open the Text Editor from the start menu.
   - Create or edit text files.
   - Save files directly into the `Documents` folder.

2. **App Maker**:
   - Open the App Maker from the start menu.
   - Enter app details (name, icon, color, HTML, and JavaScript).
   - Save the app into the `Applications` folder or download it as a `.js` file.

3. **File Explorer**:
   - Browse files and folders.
   - Right-click to access context menu options like Open, Delete, Rename, Compress, and Decompress.

---

## 🌟 First Release Notes

This is the **first release** of HTML OS, and while it is functional, there are still many features and improvements planned for future updates. Here are some key points about this release:

- **Core Features**: The basic desktop environment, file system, and built-in apps are fully functional.
- **Known Issues**:
  - Some edge cases in window management may cause unexpected behavior.
  - The file system is virtual and does not persist data after a browser session.
- **Planned Features**:
  - Persistent storage using browser APIs (e.g., LocalStorage or IndexedDB).
  - Additional built-in apps like a Calculator, Media Player, and Web Browser.
  - Improved performance and compatibility across all browsers.

---



## 🐛 Reporting Issues

If you encounter any bugs or have feature requests, please open an issue on the [GitHub Issues](https://github.com/IntellegixLabs/htmlos/issues) page.

---

## 📜 License

HTML OS is licensed under the [MIT License](https://opensource.org/licenses/MIT). Feel free to use, modify, and distribute the project as per the terms of the license.

---

## ❤️ Acknowledgments

Thank you for trying out HTML OS! This project is a labor of love, and we hope you enjoy exploring it as much as we enjoyed building it. Stay tuned for future updates and new features!
