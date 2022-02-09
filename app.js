
//gas project /apps/brookers/system 
gas_deployment_id='AKfycbzF6yGFXrdB-8umd4PBCny8dK9H0VNanKDxlysG8g8q1Xn8_8X27Ta1BonHAw-0EdsvaQ'
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
    {label:"Ice Cream Inventory",home:"Inventory",function:"navigate({fn:'ice_cream_inventory'})"},
    {label:"Admin Tools",id:"menu2", roles:["manager","owner"], menu:[
        {label:"Update User",function:"update_user()",panel:"update_user"}
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

async function ice_cream_inventory(params){
    console.log("at ice_cream_inventory ")
    hide_menu()
    if(!params){
        tag("canvas").innerHTML=` 
            <div class="page">
                <div id="inventory-title" style="text-align:center"><h2>Ice Cream Inventory</h2></div>
                <div id="inventory-message" style="width:100%"></div>
                <div id="inventory_panel"  style="width:100%"> >
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

    }else if(params.store){    
        console.log("at ice_cream_inventory params=store")
        const response=await post_data(params)

        if(response.status==="success"){
            console.log("response", response)
            tag("inventory-title").innerHTML=`<h2>${stores[params.store]} Ice Cream Inventory</h2>`
            const html=[`
            <table class="inventory-table">
                <tr>
                <th>Flavor</th>
                `]
            for(container of response.list.records[0].fields.container){
                html.push(`<th>${container}</th>`)
            }     
            html.push("</tr>")

            for(record of response.list.records){
                html.push("<tr>")
                html.push(`<td>${record.fields.name}</td>`)
                for(container of record.fields.container){
                    html.push(`<td><input id="${record.id}|${container.replace(/\s/g,"_")}" data-store="${params.store}" data-item_id="${record.id}" data-container="${container}" type="text" onchange="update_inventory_item(this)"></td>`)
                }     
                html.push("</tr>")
            }     


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
            
        }else{
            tag("inventory_panel").innerHTML="Unable to get inventory list: " + response.message + "."
        } 
    }  
}
async function update_inventory_item(entry){
    console.log(entry.dataset.item_id, entry.value)

    // add data validation
    if(isNaN(entry.value)){
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
    entry.parentElement.style.backgroundColor="lightGray"
    if(entry.dataset.obs_id){
        // there is already a record for this item.  update it
        params.mode="update_inventory_count"
        params.obs_id=entry.dataset.obs_id
        console.log("updating", params.obs_id)
        const response=await post_data(params)    
        console.log("update response", response)
        if(response.status==="success"){
            entry.parentElement.style.backgroundColor="white"
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
            entry.parentElement.style.backgroundColor="white"
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


