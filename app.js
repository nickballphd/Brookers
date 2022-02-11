
//gas project /apps/brookers/system 
gas_deployment_id='AKfycbyckZb6M3FNpoVamuo3RJXoAXQnFmpM_0HLmd-Fq2EHTad6kWDZbxvRJ-IXTTiOyk0PqQ'
const gas_end_point = 'https://script.google.com/macros/s/'+gas_deployment_id+'/exec'

//plant simple provo
const nav_menu=[
    {label:"Home",function:"navigate({fn:'show_home'})"},
]


const unauthenticated_menu=[
    {menu:nav_menu},
    {},
    {label:"Login",function:"login()",home:"Login",panel:"login_panel"},
    
    {label:"Recover Password",function:"recover_password()",panel:"recover"}, 
]
//{label:get_user_name()},
const authenticated_menu=[
    {menu:nav_menu},
    {},
    {label:get_user_name,id:"user-menu", menu:[
        {label:"Change Password",function:"change_password()",panel: "password_panel"},
        {label:"Personal Data",function:"navigate({fn:'personal_data'})"},
    ]},
    {label:"Logout",function:"logout()", home:"Logout"},
    {label:"Enter Ice Cream Inventory",home:"Inventory",function:"navigate({fn:'ice_cream_inventory',params:{style:'update'}})"},
    {label:"Ice Cream Inventory Summary",home:"Inventory",function:"navigate({fn:'ice_cream_inventory',params:{style:'summary'}})", roles:["employee","manager","owner"]},
    {label:"Admin Tools",id:"menu2", roles:["manager","owner"], menu:[
        {label:"Update User",function:"update_user()",panel:"update_user"},
        {label:"Archive Inventory",function:"navigate({fn:'archive_inventory'})"},
    ]},

]






function show_home(){
    
    //build the menu for the home screen
    const menu=[]
    for(item of current_menu){
        if(item.home){
            menu.push(`<a onClick="${item.function}">${item.home}</a>`)
        }
    }

    tag("canvas").innerHTML=` 
    <div class="center-screen">
    
    <p><img height="${window.innerHeight * .6}" src="https://www.brookersicecream.com/wp-content/uploads/2018/08/brookers-logo-final-large.png"></p>
    <div style="text-align:center"><p>${menu.join(" | ")}</p></div>
    
    
    </div>
    `


    hide_menu()
}

function get_user_name(){
    data=get_user_data()
    return data.first_name + " " + data.last_name
}

async function show_schedule(){
    let airtable_object_id="shrxZ1H56Kh3Jds3e"
    let width = 670

    if(intersect(get_user_data().roles, "user").length>0){
        const response=await post_data({
            mode:"get_airtable_object_id",
            name:"schedule"
        })
        if(response.status==='success'){
            airtable_object_id=response.data
            width=850
        }else{
            console.log(response)
        }
    }
    tag("canvas").innerHTML=`<div class="center-screen"><iframe class="airtable-embed" src="https://airtable.com/embed/${airtable_object_id}?backgroundColor=cyan" frameborder="0" onmousewheel="" width="${width}" height="500" style="background-color: white; border: 1px solid #ccc;"></iframe></div>`
   
    hide_menu()
}

async function show_topics(){
    let width = 670
    const response=await post_data({
        mode:"get_airtable_object_id",
        name:"list_topics"
    })
    if(response.status==='success'){
        var airtable_object_id=response.data
    }else{
        console.log(response)
    }

    tag("canvas").innerHTML=`<div class="center-screen"><iframe class="airtable-embed" src="https://airtable.com/embed/${airtable_object_id}?backgroundColor=cyan" frameborder="0" onmousewheel="" width="${width}" height="500" style="background-color: white; border: 1px solid #ccc;"></iframe></div>`
   
    hide_menu()
}


async function add_topics(){
    let width = 400
    const response=await post_data({
        mode:"get_airtable_object_id",
        name:"add_topics"
    })
    if(response.status==='success'){
        var airtable_object_id=response.data
    }else{
        message({
            message:"Topic not added: " + response.message,
            title:"Server Error",
            kind:"error",
            seconds:5    
        })
    }

    tag("canvas").innerHTML=`<div class="center-screen"><iframe class="airtable-embed" src="https://airtable.com/embed/${airtable_object_id}?backgroundColor=cyan" frameborder="0" onmousewheel="" width="${width}" height="${window.innerHeight*.9}" style="background-color: white; border: 1px solid #ccc;"></iframe></div>`
   
    hide_menu()
}


function show_recipes(){
    window.open("/index.html", '_blank');
}


async function archive_inventory(){
    console.log("at archive")
    hide_menu()
    const msgbox =  message({
            message:"This may take a couple of minutes.",
            title:"Hang in there...",
            kind:"info"
        })
    const params={mode:"archive_inventory"}
    const response=await post_data(params)
    msgbox.remove()
    if(response.status==="success"){
        message({
            message:response.message,
            title:"Success",
            seconds:3
        })
    }else{
        message({
            message:response.message,
            title:"Data Error",
            kind:"error",
            seconds:8    
        })

    }
    
}


async function ice_cream_inventory(params){
    console.log("at ice_cream_inventory ")
    hide_menu()
    console.log('params',params)
    console.log('params',params.params)

    if(params.style){
        tag("canvas").innerHTML=` 
            <div class="page">
                <div id="inventory-title" style="text-align:center"><h2>Ice Cream Inventory</h2></div>
                <div id="inventory-message" style="width:100%"></div>
                <div id="inventory_panel"  style="width:100%">
                </div>
            </div>  
        `
        const user_data = get_user_data()
        console.log ("user_data",user_data)
        if(user_data.store.length===1){
            tag("inventory-message").innerHTML='<i class="fas fa-spinner fa-pulse"></i>'
            ice_cream_inventory({
                mode:"get_inventory_list",
                filter:"list='Ice Cream'",
                store:user_data.store[0]
            })
        }else{
          if(params.style==='summary'){
            tag("inventory-message").innerHTML='<i class="fas fa-spinner fa-pulse"></i>'
            ice_cream_inventory({
                mode:"get_inventory_list",
                filter:"list='Ice Cream'",
                store:user_data.store
            })

          }else{
            //add form to select store
            const html=['<form>Store: <select name="store">']
            for(store of user_data.store){
                html.push(`<option value="${store}">${stores[store]}</option>`)
            }
            html.push(`</select>
                        <button type="button" id="choose_store_button" onclick="ice_cream_inventory(form_data(this,true))">Submit</button>
                        <input type="hidden" name="mode" value="get_inventory_list">
                        <input type="hidden" name="filter" value="list='Ice Cream'">
                        </form>`)
            tag("inventory_panel").innerHTML=html.join("")
          }
        }

    }else if(params.store){    
        console.log("at ice_cream_inventory params=store")
        const response=await post_data(params)
        tag("inventory-message").innerHTML=''




        if(response.status==="success"){
            
            if(response.report_style==='summary'){
            //this is generating the summary report

                console.log("response", response)
                tag("inventory-title").innerHTML=`<h2>Ice Cream Inventory Summary</h2>`



                const header=[`
                <table class="inventory-table">
                    <tr>
                    <th>Flavor</th>
                    `]
                for(const store of store_sequence){
                    header.push(`<th>${store}</th>`)

                }   

                header.push(`<th>Total</th>`)
                header.push("</tr>")
                const html=[header.join("")]

                irregular=[]// icecream not in regular category
                for(record of response.list.records){
                    let target=html
                    if(record.fields.category!=="Regular"){
                        target=irregular
                    }
                    target.push("<tr>")
                    target.push(`<td style="text-align:left">${record.fields.name}</td>`)
                    for(store of store_sequence){
                        target.push(`<td id="${record.id}|${stores[store]}"></td>`)
                    }
                    target.push(`<td id="${record.id}|total"></td>`)
                    target.push("</tr>")
                }     

                html.push("</table><br>")
                html.push(header.join(""))
                html.push(irregular.join(""))
                html.push("</table>")
                tag("inventory_panel").innerHTML=html.join("")


                // find the most recent numbers for each store
                const data={}
                if(response.data.records){
                    for(record of response.data.records){
                        const id = record.fields.item[0] + "|" + record.fields.store[0]
                        if(!data[id]){
                            data[id]={quantity:record.fields.quantity,date:record.fields.date}
                        }
                    }
                    console.log("=========================data=================================")
                    console.log(data)
                    console.log("===========================================================")
    
                    // now fill the existing data
                    for(const[key,value] of Object.entries(data)){
                        const total_box = tag(key.split("|")[0] + "|total")
                        const box = tag(key)
                        if(box.innerHTML===""){
                            box.innerHTML=value.quantity
                        }else{
                            box.innerHTML=parseFloat(box.innerHTML)+value.quantity
                        }
                        if(total_box.innerHTML===""){
                            total_box.innerHTML=value.quantity
                        }else{
                            total_box.innerHTML=parseFloat(total_box.innerHTML)+value.quantity
                        }
  
                    }
                }
                
            }else{
            //this is generating the form for updating inventory counts in an individual store
                // keep track of navigation
                window.rows={}
                window.cols={}
                console.log("response", response)
                tag("inventory-title").innerHTML=`<h2>${stores[params.store]} Ice Cream Inventory</h2>`
                const html=["Fill in every row in this section."]
                const header=[`
                <table class="inventory-table">
                    <tr>
                    <th>Flavor</th>
                    `]
                let p=1 // map store ids to column numbers.  only needed for this loop then can be reused
                for(container of response.list.records[0].fields.container){
                    header.push(`<th>${container}</th>`)
                    window.cols[p]=container
                    window.cols[container]=p++
                }     
                header.push("</tr>")
                html.push(header.join(""))
                irregular=[]// icecreame not in regular category

                p=1// for keeping track of navigating rows.  can be reused after this loop
                for(record of response.list.records){
                    // object to allow the navigation from row to row
                    window.rows[p]=record.id
                    window.rows[record.id]=p++

                    let target=html
                    if(record.fields.category!=="Regular"){
                        target=irregular
                    }
                    target.push("<tr>")
                    target.push(`<th>${record.fields.name}</th>`)
                    for(container of record.fields.container){
                        target.push(`<td><input id="${record.id}|${container.replace(/\s/g,"_")}" data-store="${params.store}" data-item_id="${record.id}" data-container="${container}" type="text" onchange="update_inventory_item(this)"></td>`)
                    }     
                    target.push("</tr>")
                }     
                html.push("</table>")
                html.push("<br>In this section, fill in only the rows corresponding to flavors you have on hand.")
                html.push(header.join(""))
                html.push(irregular.join(""))
                html.push("</table>")
                tag("inventory_panel").innerHTML=html.join("")

                // now fill the existing data
                if(response.data.records){
                    for(record of response.data.records){
                        console.log(record)
                        tag(record.fields.item[0] + "|" + record.fields.container.replace(/\s/g,"_")).dataset.obs_id=record.id
                        tag(record.fields.item[0] + "|" + record.fields.container.replace(/\s/g,"_")).value=record.fields.quantity
                    }
                }

                tag("inventory_panel").addEventListener("keyup", function(event) {
                    if (event.keyCode === 13) {
                      move_down(event.target);
                    }
                });                

                
            } 
        }else{
            tag("inventory_panel").innerHTML="Unable to get inventory list: " + response.message + "."
        }

    }  

}


function move_down(source){
    // selects the next cell below
    const ids=source.id.split("|")
    ids[1]=ids[1].replace(/_/g," ")
    
    let next_flavor=window.rows[window.rows[ids[0]]+1]
    let next_container=ids[1]
    if(!next_flavor){
        next_flavor=window.rows[1]
        next_container = window.cols[window.cols[next_container]+1]
        if(!next_container){
            next_container=window.cols[1]
        }
    }
    tag(next_flavor + "|" + next_container.replace(/\s/g,"_")).focus()
}


async function update_inventory_item(entry){
    //console.log(entry.parentElement)

    // add data validation
    if(isNaN(entry.value)){
        entry.parentElement.style.backgroundColor="lightGray"
        message({
            message:"Please enter a number",
            title:"Data Error",
            kind:"error",
            seconds:5    
        })
        entry.focus()
        entry.select()

        return
    }

    const params={
        item_id:entry.dataset.item_id,
        quantity:entry.value,
        container:entry.dataset.container,
        store:entry.dataset.store,
    }
    entry.parentElement.style.backgroundColor=null
    entry.parentElement.className="working"
    
    if(entry.dataset.obs_id){
        // there is already a record for this item.  update it
        params.mode="update_inventory_count"
        params.obs_id=entry.dataset.obs_id
        console.log("updating", params.obs_id)
        const response=await post_data(params)    
        console.log("update response", response)
        if(response.status==="success"){

            entry.parentElement.className=null
            //entry.parentElement.style.backgroundColor="white"
            entry.dataset.obs_id=response.records[0].id
        }else{
            entry.style.backgroundColor="red"
            message({
                message:"Inventory Not Recorded: " + response.message,
                title:"Data Error",
                kind:"error",
                seconds:5    
            })
        }

    }else{
        // there is no record for this item, insert it
        params.mode="insert_inventory_count"
        console.log("inserting")
        const response=await post_data(params)    
        console.log("insert response", response)
        if(response.status==="success"){
            entry.parentElement.className=null
            entry.dataset.obs_id=response.records[0].id
        }else{
            entry.style.backgroundColor="red"
            message({
                message:"Inventory Not Recorded: " + response.message.message,
                title:"Data Error",
                kind:"error",
                seconds:5    
            })
            }
    }
}


async function expense_list(){
    const response=await post_data({
        mode:"expense_list",
        filter:""
    })

    const columns=["expense_description","expense_date", "cost"]
    const html=["<table><tr>"]
    for(const field of response.fields){
        html.push("<th>")
        html.push(field)
        html.push("</th>")
    }

    for(const record of response.records){
        html.push("<tr>")
        console.log(record)
        for(const field of columns){
            html.push("<td>")
            html.push(record.fields[field])
            html.push("</td>")
        }
        html.push(`<td><a target="_blank" href="${record.fields.receipt_image[0].url}">`)
        html.push(`<img src="${record.fields.receipt_image[0].thumbnails.small.url}">`)
//        html.push(record.fields[field])
        html.push("</td>")

        html.push("</tr>")
    }
    html.push("</table>")

    tag("canvas").innerHTML=html.join("")
    hide_menu()
}


