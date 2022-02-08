
//gas project /apps/brookers/system 
gas_deployment_id='AKfycbxyyKDnGFO0T0R3qxJZO8XqkZeAMbDKSpFcwGggDMm93kwPNjHmbZsEXyirngXubqaYxQ'
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
            <div style="text-align:center"><h2>Ice Cream Inventory</h2></div>
            <div id="inventory_panel">
            <div id="inventory-message"></div>
            
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

        }

    }else if(params.store){    
        console.log("at ice_cream_inventory params=store")
        const response=await post_data(params)

        console.log("response", response)
        return

        const labels={
            first_name:"First Name",
            last_name:"Last Name",
            email:"Email",
            phone:"Phone",
        }


        const is_admin=intersect(get_user_data().roles, "administrator").length>0

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
                    if(intersect(record.fields.roles, "member").length===0){
                        html.push(`<a class="tools" onclick="update_user({email:'${record.fields.email}', button:'Update User', mode:'update_user', make_member:true},tag('member-list-message'))">Make Member</a>`)
                    }else{
                        html.push(`<a class="tools" onclick="update_user({email:'${record.fields.email}', button:'Update User', mode:'update_user'},tag('member-list-message'))">Update</a>`)
                    }
                    html.push("</td>")
                }
                html.push("</tr>")
            }
            html.push("</table>")
        
            tag("member_list_panel").innerHTML=html.join("")
        
        }else{
            tag("member_list_panel").innerHTML="Unable to get member list: " + response.message + "."
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


