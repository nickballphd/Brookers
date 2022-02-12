
//gas project /apps/brookers/system 
const gas_end_point = 'https://script.google.com/macros/s/'+gas_deployment_id()+'/exec'

//plant simple provo
const nav_menu=[
    {label:"Home",function:"navigate({fn:'show_home'})"},
    {label:"Locations",function:"navigate({fn:'show_locations'})"},
    
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
    {label:"Time Off",id:"menu1",menu:[
        {label:"Request Time Off",function:"navigate({fn:'request_time_off'})"}, 
        {label:"My Requests",function:"navigate({fn:'show_time_off'})"}, 
    ]},
    {label:"Add Employee",function:"navigate({fn:'create_account'})", roles:["manager","owner","administrator"]}, 
    {label:"Enter Ice Cream Inventory",home:"Inventory",function:"navigate({fn:'ice_cream_inventory',params:{style:'update'}})"},
    {label:"Employee List",function:"navigate({fn:'employee_list'})"},
    {label:"Ice Cream Inventory Summary",home:"Inventory",function:"navigate({fn:'ice_cream_inventory',params:{style:'summary'}})", roles:["owner"]},
    {label:"Admin Tools",id:"menu2", roles:["manager","owner","administrator"], menu:[
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
    <div style="text-align:center"></div>
    
    
    </div>
    `


    hide_menu()
}

function get_user_name(){
    data=get_user_data()
    return data.first_name + " " + data.last_name
}

async function show_locations(){
    const airtable_object_id="shrwz1d1aExJUIbUo"
    const width = 400
    tag("canvas").innerHTML=`<div class="center-screen"><iframe class="airtable-embed" src="https://airtable.com/embed/${airtable_object_id}?backgroundColor=cyan" frameborder="0" onmousewheel="" width="${width}" height="500" style="background-color: white; border: 1px solid #ccc;"></iframe></div>`
    hide_menu()
}

async function request_time_off(){
    if(!logged_in()){show_home();return}
    const airtable_object_id="shra7pqsxDNQzkh15"
    const width = 300
    const url=`https://airtable.com/embed/${airtable_object_id}?prefill_employee=${get_user_data().id}`
    console.log("url",url, get_user_data())
    tag("canvas").innerHTML=`<div class="center-screen"><iframe class="airtable-embed" src="${url}" frameborder="0" onmousewheel="" width="${width}" height="500" style="background-color: white; border: 1px solid #ccc;"></iframe></div>`
    hide_menu()
}

async function show_time_off(){
    if(!logged_in()){show_home();return}
    const airtable_object_id="shroqlDqLdgd406A0"
    const width = 300
    const user_data = get_user_data()
    const url=`https://airtable.com/embed/${airtable_object_id}?filter_employee=${user_data.first_name}+${user_data.last_name}`
    console.log("url",url, get_user_data())
    tag("canvas").innerHTML=`<div class="center-screen"><iframe class="airtable-embed" src="${url}" frameborder="0" onmousewheel="" width="${width}" height="500" style="background-color: white; border: 1px solid #ccc;"></iframe></div>`
    hide_menu()
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
    if(!logged_in()){show_home();return}//in case followed a link after logging out

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
                        target.push(`<td><input id="${record.id}|${container.replace(/\s/g,"_")}" data-store="${params.store}" data-item_id="${record.id}" data-container="${container}" type="text" onchange="update_observation(this)"></td>`)
                    }     
                    target.push("</tr>")
                }     
                html.push("</table>")
                html.push("<br>In this section, fill in only the rows corresponding to flavors you have on hand.")
                html.push(header.join(""))
                html.push(irregular.join(""))
                html.push("</table>")
                tag("inventory_panel").innerHTML=html.join("")

                // add quick buttons
                for(const [key,row] of Object.entries(window.rows)){
                    if(isNaN(row)){
                        for(const [key,col] of Object.entries(window.cols)){
                            if(isNaN(col)){
                                add_buttons(row,col)
                            }
                        }
                    }
                }

                const val_map={
                    "0":0  ,
                    "1":1  ,
                    "2":2  ,
                    "3":3  ,
                    "4":4  ,
                    "¼":.25,
                    "½":.5 ,
                    "¾":.75
                }

                // now fill the existing data
                if(response.data.records){
                    for(record of response.data.records){
                        const box=tag(record.fields.item[0] + "|" + record.fields.container.replace(/\s/g,"_"))
                        box.dataset.obs_id=record.id
                        box.value=record.fields.quantity
                        for(const div of getAllSiblings(box)){
                            console.log(div.tagName,div.innerHTML,record.fields.quantity,val_map[div.innerHTML],record.fields.quantity===val_map[div.innerHTML])
                            if(div.tagName==="DIV" && record.fields.quantity===val_map[div.innerHTML]){
                                div.style.backgroundColor="lightGrey"
                                div.style.color="black"
                            }
                        }
                        box.parentElement.style.backgroundColor="lightYellow"
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
function add_buttons(row,col){
    const box = tag(row + "|" + col.replace(/\s/g,"_"))    
    const container = box.parentElement
    switch(window.cols[col]){
        case 3:
            box.style.display="none"
            container.appendChild(get_div_button(box,"20%",0,"0"))
            container.appendChild(get_div_button(box,"20%",.25,"&#188;"))
            container.appendChild(get_div_button(box,"20%",.5,"&#189;"))
            container.appendChild(get_div_button(box,"20%",.75,"&#190;"))
            container.appendChild(get_div_button(box,"20%",1,"1"))
            break;
        case 2:
            box.style.width="30px"
            container.prepend(get_div_button(box,"15%",2))
            container.prepend(get_div_button(box,"15%",1))
            container.prepend(get_div_button(box,"15%",0))
            break
        case 1:
            box.style.width="30px"
            container.prepend(get_div_button(box,"15%",4))
            container.prepend(get_div_button(box,"15%",3))
            container.prepend(get_div_button(box,"15%",2))
            container.prepend(get_div_button(box,"15%",1))
            container.prepend(get_div_button(box,"15%",0))
            break
        }
}

function get_div_button(box,width,value,label){
    if(label===undefined)(label=value)
    const div=document.createElement('div')
    div.addEventListener("click",async function(event){
        box.value=value
        if(await update_observation(box)){
            for(const div of getAllSiblings(this)){
                if(div.tagName==="DIV"){
                    div.style.backgroundColor="transparent"
                    div.style.color="lightGray"
                    console.log(div)
                }
            }
            this.style.backgroundColor="lightGray"
            this.style.color="black"
        }
    })
    div.style.height="100%"
    div.style.display="inline-block"
    div.style.width=width
    div.style.textAlign="center"
    div.style.borderRadius="50%"
    div.style.color="lightgrey"
    div.innerHTML=label
    
    return div
}

function getAllSiblings(elem, filter) {
    var sibs = [];
    elem = elem.parentNode.firstChild;
    do {
        //if (elem.nodeType === 3) continue; // text node
        //if (!filter || filter(elem))
        sibs.push(elem);
    } while (elem = elem.nextSibling)
    return sibs;
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


async function update_observation(entry){
    //console.log(entry.parentElement)
    if(!logged_in()){show_home();return}
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
            entry.parentElement.style.backgroundColor="lightYellow"
            entry.dataset.obs_id=response.records[0].id
            return true
        }else{
            entry.style.backgroundColor="red"
            message({
                message:"Inventory Not Recorded: " + response.message,
                title:"Data Error",
                kind:"error",
                seconds:5    
            })
            return false
        }

    }else{
        // there is no record for this item, insert it
        params.mode="insert_inventory_count"
        console.log("inserting")
        const response=await post_data(params)    
        console.log("insert response", response)
        if(response.status==="success"){
            entry.parentElement.className=null
            entry.parentElement.style.backgroundColor="lightYellow"
            entry.dataset.obs_id=response.records[0].id
            return true
        }else{
            entry.style.backgroundColor="red"
            message({
                message:"Inventory Not Recorded: " + response.message.message,
                title:"Data Error",
                kind:"error",
                seconds:5    
            })
            }
            return false
    }
}


async function employee_list(){
    if(!logged_in()){show_home();return}//in case followed a link after logging out
    hide_menu()
    tag("canvas").innerHTML=` 
    <div class="page">
        <h2>Employee List</h2>
        <div id="member-list-message" style="padding-top:1rem;margin-bottom:1rem">
        Employee information is private and should not be shared.
        </div>
        <div id="employee_list_panel">
        <i class="fas fa-spinner fa-pulse"></i>
        </div>
    </div>
    `
    const response=await post_data({
        mode:"employee_list",
        filter:""
    })

    const labels={
        first_name:"First Name",
        last_name:"Last Name",
        email:"Email",
        phone:"Phone",
    }


    const is_admin=intersect(get_user_data().roles, ["administrator","owner","manager"]).length>0

    if(response.status==="success"){
        const html=['<table style="background-color:white"><tr>']
        for(const field of response.fields){
            html.push("<th>")
            html.push(labels[field])
            html.push("</th>")
        }
        if(is_admin){html.push("<th>Action</th>")}
        html.push("</tr>")

        for(const record of response.records){
            html.push("<tr>")
            console.log(record)
            for(const field of response.fields){
                if(record.fields[field]==="withheld"){
                  html.push('<td style="color:lightgray">')
                }else{
                  html.push("<td>")
                }
                html.push(record.fields[field])
                html.push("</td>")
            }
            if(is_admin){
                html.push("<td>")
                    html.push(`<a class="tools" onclick="update_user({email:'${record.fields.email}', button:'Update User', mode:'update_user'},tag('member-list-message'))">Update</a>`)
                html.push("</td>")
            }
            html.push("</tr>")
        }
        html.push("</table>")
    
        tag("employee_list_panel").innerHTML=html.join("")
    
    }else{
        tag("employee_list_panel").innerHTML="Unable to get member list: " + response.message + "."
    }    

}

