var getData = async function(id){
    // this function fetches data from the api to create a history table
    // for the item with inv_id = id.
    const url = `/api/inventory/${id}/history`;
    const resp = await fetch(url, {credentials: 'include'})
    const data = await resp.json()
    const rows = data.results

    // delete existing table if it already exists
    let tbl = document.querySelector('.inv-his-table')
    if(tbl) tbl.remove();
    let errH3 = document.querySelector('#error-h3')
    if(errH3) errH3.remove();

    // if the fetch does not have any results, then we show an error
    if (data.results.length < 1){
        // document.querySelector('#hiddenvalue').value = "No Item History."
        var modalBod = document.querySelector('.modal-body')
        errH3 = document.createElement('H3');
        errH3.id = 'error-h3';
        errH3.textContent = 'ERROR FETCHING TABLE';
        modalBod.appendChild(errH3);
    }else {
        // creation of table using js dom manipulation
        tbl = document.createElement('TABLE');
        tbl.classList.add('inv-his-table')
        tbl.classList.add('table')
        tbl.classList.add('table-condensed')
        tbl.classList.add('table-responsive')
        tbl.border = '5px';
        var thead = document.createElement('THEAD')
        tbl.appendChild(thead)
        var tabTr = document.createElement('TR')
        thead.appendChild(tabTr)
        for (var key in rows[0]){
            var tabTh = document.createElement('TH')
            tabTh.textContent = key;
            tabTr.appendChild(tabTh)
        }
        var tabBod = document.createElement('tbody')
        tbl.appendChild(tabBod)

        rows.forEach(row => {
            var tabTr = document.createElement('TR');
            tabBod.appendChild(tabTr);
            for(var key in row){
                var tabTh = document.createElement('TH')
                tabTh.textContent = row[key]
                tabTr.appendChild(tabTh)
                // document.querySelector('#hiddenvalue').value += key;
                // document.querySelector('#hiddenvalue').value += ": " + row[key];
            }
        })
        var modalBod = document.querySelector('.modal-body')
        modalBod.appendChild(tbl)
    }
}

const changeBtnText = () => {
    // small QOL fix to change the show history button to hide history
    let btnText = document.querySelector('#show-hide-history-btn').textContent;
    if(btnText === 'Show History'){
        document.querySelector('#show-hide-history-btn').textContent = 'Hide History';
    } else {
        document.querySelector('#show-hide-history-btn').textContent = 'Show History';
    }
}

const loadDataOnForms = async function(id){
        // this function is called to update the forms on the modal.
        // we use a fetch so that it's always current.
    const url = `/api/inventory/${id}`;
    const resp = await fetch(url, {credentials: 'include'})
    const data = await resp.json()
    if (data.results.length < 1){
        document.getElementById('description-input').value = 'Error';
    } else {
        rows = data.results;
        document.getElementById('description-input').value = rows[0].description;
        document.getElementById('category-input').value = rows[0].category;
        document.getElementById('storage-input').value = rows[0].storage_location;
        document.getElementById('quantity-input').value = rows[0].quantity;
        document.getElementById('available-input').value = rows[0].available;
    }
}

const updateItem = async function(args){
    //this function sends data obj to api to update db for item
    const data_id = document.querySelector('#modal-inv-id').value;
    const url = `/api/inventory/${data_id}`;
    const data = {
        description: document.getElementById('description-input').value,
        category: document.getElementById('category-input').value,
        storage: document.getElementById('storage-input').value,
        quantity: document.getElementById('quantity-input').value
    }
    if(args === 'remove'){
        data.remove = true;
    }
    const resp = fetch(url, {
        method: "PUT",
        credentials: 'include',
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(data),
    })
    .then(fetched =>{
        fetched.json()
        .then(responseData =>{
            if(responseData.error){
                console.log(responseData.error)
                let errorLbl = document.querySelector("#error-message");
                errorLbl.textContent = responseData.error;
                errorLbl.removeAttribute("hidden")
            }
            else{
                location.reload()
            }
        })
    })
    .catch(err => console.log('Error: ',err))

}

$(document).ready(function() {

    $('a[data-toggle=modal], button[data-toggle=modal]').click(function () {
        // this function runs when the modal is opened.

        var data_id = '';
        var data_desc = '';

        if (typeof $(this).data('id') !== 'undefined') {
            data_id = $(this).data('id');
            document.querySelector('#modal-inv-id').value = data_id;
        }

        if (typeof $(this).data('description') !== 'undefined') {
            data_desc = $(this).data('description');
        }

        loadDataOnForms(data_id);

        getData(data_id);
    })
});
