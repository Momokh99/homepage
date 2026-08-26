import { savedWidgets } from './widget.js'
import {delayGreeting} from './promise.js'
const container = document.createElement("div");
container.id = "widget-container"
document.body.append(container)

for (const widget of savedWidgets) {
    const box = document.createElement("div")
    box.textContent=widget.label
    box.className = "widget"
    box.dataset.type = widget.type
    container.appendChild(box);
}

async function handleClick(){
    const msg = await delayGreeting(input.value)
    h1.textContent = msg
}

const input = document.getElementById("searh")
const buttSearch = document.getElementById("buttSearch")
const h1 = document.getElementById("searchTitle")

buttSearch.addEventListener("click", () => {
  handleClick()})
