export function delayGreeting(name) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve( `hello ${name}`)
    }, 1000)
  })
}

