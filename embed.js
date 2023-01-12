if(location.pathname.includes('inflation-observer')) {

    // Create the new node to insert
    const introPar = document.createElement("span");
    introPar.innerHTML = 'Inflation Observer';
    const parentDiv = document.getElementById("adh-embed").parentNode;
    let embed = document.getElementById("adh-embed");
    parentDiv.insertBefore(introPar, embed);
    
}

