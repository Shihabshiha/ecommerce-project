
//add to cart

function addtoCart(productId){
  console.log('ajax loaded');
  console.log(productId);
  $.ajax({
    url: '/add-to-cart',
    data:{
      productId
    },
    method: "post",
    success: (response) => {
      if (response.status) {
        let count=$('#cart-count').html()
        count=parseInt(count)+1
        $("#cart-count").html(count)
        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Product Added Successfully!',
          showConfirmButton: false,
          timer: 1000
        })
      }
   },
  });
}

//change quantity

function changeQuantity(cartId, productId,userId, count) {
  let quantity = parseInt(document.getElementById(productId).innerHTML);
  count = parseInt(count); 
  $.ajax({
    url: "/change-quantity",
    data: {
      user:userId,
      cart: cartId,
      product: productId,
      count: count,
      quantity: quantity,
    },
    method: "post",
    success: (response) => {
      if (response.removed) {
            Swal.fire({
              title: 'Good Job',
              text: 'Item removed!',
              icon: 'error',
              timer: 1000 // time in milliseconds
            });

            // Reload the page after the timer expires
            setTimeout(() => {
              location.reload();
            }, 1000); // time in milliseconds
          
      } else {
        document.getElementById(productId).innerHTML = quantity + count;
        let price = document.getElementById(`price-${productId}`).innerText
        price = rupeesToInteger(price)
        let qty = quantity +count
        console.log(price,qty)
        let subtotal = price * qty
        console.log(subtotal)
        document.getElementById(`subtotal-${productId}`).innerHTML = formatMoney(subtotal)
        document.getElementById('total').innerHTML=formatMoney(response.total) ;
        document.getElementById('total1').innerHTML=formatMoney(response.total);
      }
    },
     error: function (error) { // corrected parameter name (data -> error)
      alert(error);
      console.log(JSON.stringify(error));
    }, 
  });
}

function rupeesToInteger(amountStr) {
  // Remove commas and the currency symbol from the string
  const amountNum = parseFloat(amountStr.replace(/[^\d.]/g, ''));
  // Convert to integer by rounding off to the nearest integer
  const integerVal = Math.round(amountNum);
  // Return the integer value
  return integerVal;
}

function formatMoney(amount) {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return formatter.format(amount);
}



//remove products from cart

function removeProduct(cartId,productId){
  Swal.fire({
   title: 'Are you sure?',
   text: "item will be removed from cart.!",
   icon: 'warning',
   showCancelButton: true,
   confirmButtonColor: '#3085d6',
   cancelButtonColor: '#d33',
   confirmButtonText: 'Yes, delete it!'
  }).then((result) => {
   if (result.isConfirmed) {
     
     Swal.fire({
       title: 'Deleted!',
       text: 'Your file has been deleted.',
       icon: 'success',
       timer: 3000, 
       timerProgressBar: true,
       showConfirmButton: false
     })
     removeProductSuccess(cartId, productId);
   }
  });
 
 }
 
 function removeProductSuccess(cartId,productId){
     $.ajax({
         url: "/removeProduct",
         data: {
             cart:cartId,
             product:productId
         },
         method:'put',
         success:(response)=>{
             if(response.removed){
                 location.reload();
             }else{
                 alert("deletion failed")
             }
         }
     })
 }
 



 function changeOrderStatus(orderId, currentStatus, newStatus) {
  $.ajax({
    type: "POST",
    url: "/admin/change-status",
    data: {
      orderId: orderId,
      currentStatus: currentStatus,
      newStatus: newStatus
    },
    success: function (response) {
      if (response.status) {
        Swal.fire({
          title: 'Good job!',
          text: 'Order Status changed!',
          icon: 'success',
          showConfirmButton: false,
          timer:1500
        });

        // Update the status in the corresponding row of the table
        updateStatusInTable(orderId, newStatus);
        location.reload()
      } else {
        alert("Status update failed");
      }
    },
  });
}

function updateStatusInTable(orderId, newStatus) {
  var row = $('td:contains(' + orderId + ')').closest('tr');
  var statusCell = row.find('td:eq(5)');
  statusCell.html('<span class="badge rounded-pill ' + getStatusBadgeClass(newStatus) + '">' + newStatus + '</span>');
  statusCell.attr('data-status', newStatus);
}

// Helper function to get the corresponding status badge class
function getStatusBadgeClass(status) {
  if (status === "placed") {
    return "alert-success";
  } else if (status === "pending") {
    return "alert-warning";
  } else if (status === "cancelled") {
    return "alert-danger";
  } else if (status === "confirmed") {
    return "alert-warning";
  } else if (status === "shipped") {
    return "alert-primary";
  } else if (status === "delivery") {
    return "alert-info";
  } else if (status === "completed") {
    return "alert-secondary";
  } else {
    return "";
  }
}


//delete the address
function deleteAddress(address){
  Swal.fire({
    title: 'Are you sure?',
    text: "Address will be removed!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
   }).then((result) => {
    if (result.isConfirmed) {
      deleteAddressSuccess(address)
    }
   });
  
}


function deleteAddressSuccess(address){
  $.ajax({
    method:'post',
    url:"/deleteAddress",
    data:{addressId:address},
    success: (response)=>{
      if(response.status){
        Swal.fire({
          title: "Success!",
          text: "Your address has been deleted.",
          icon: "success",
          showConfirmButton: false,
          timer:1000
        });
      }
      location.reload()
    },
    error: (error)=> { 
      alert(error);
      console.log(JSON.stringify(error));
    }
 })
}

function cancelOrder(orderId){
  Swal.fire({
    title: 'Are you sure?',
    text: "Order will be cancelled!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, Cancel order!'
   }).then((result) => {
    if (result.isConfirmed) {
      cancelOrderSuccess(orderId)
    }
   });
  
}

function cancelOrderSuccess(orderId) {
  $.ajax({
    method: 'post',
    url: "/cancelOrder",
    data: { orderId: orderId },
    success: async (response) => {
      if (response.status) {
        if (response.returnToWallet) {
          const { value: accepted } = await Swal.fire({
            title: 'Success!',
            text: 'Your order has been cancelled and the amount has been refunded to your wallet.',
            icon: 'success',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ok'
          });
          if (accepted) {
            location.reload();
          }
        } else {
          Swal.fire({
            title: "Success!",
            text: "Your order has been cancelled.",
            icon: "success",
            showConfirmButton: false,
            timer: 1000
          }).then(() => {
            location.reload();
          });
        }
      } else {
        Swal.fire({
          title: "Failed to cancel!",
          text: response.message,
          icon: "error",
          showConfirmButton: false,
          timer: 1500
        });
      }
    },
    error: (error) => { 
      console.log(JSON.stringify(error));
      Swal.fire({
        title: "Failed to cancel!",
        text: "An error occurred while cancelling the order.",
        icon: "error",
        showConfirmButton: false,
        timer: 1500
      });
    }
  });
}

//return item by user
function returnItemByUser(proId,qty,odrId,odrDate){
  console.log(odrId);
  Swal.fire({
    title: 'Reason for return',
    input: 'text',
    inputLabel: 'Please provide the reason for return:',
    inputPlaceholder: 'Reason',
    confirmButtonText: 'Submit',
    showCancelButton: true,
    cancelButtonText: 'Cancel',
    showLoaderOnConfirm: true,
    preConfirm: (reason) => {
      return new Promise((resolve) => {
        if (!reason) {
          Swal.showValidationMessage('Please provide a reason for return');
          resolve();
        } else {
          $.ajax({
            method: 'post',
            url: "/returnItem",
            data: { productId: proId, quantity: qty, orderId:odrId ,reason: reason ,orderDate:odrDate},
            success: async (response) => {
              if(response.status){
                Swal.fire({
                  title: "Success!",
                  text: "Your order has been returned. waiting for confirmation from seller",
                  icon: "success",
                  showConfirmButton: true,
                }).then(() => {
                  location.reload();
                });
              } else {
                Swal.fire({
                  title: "Failed to return!",
                  text: response.message,
                  icon: "error",
                  showConfirmButton: false,
                  timer: 1500
                });
              }
              resolve();
            },
            error: (error) => { 
              console.log(JSON.stringify(error));
              let errorMessage = error.responseJSON ? error.responseJSON.message : "An error occurred while returning the item.";
              Swal.fire({
                title: "Failed to return!",
                text: errorMessage,
                icon: "error",
                showConfirmButton: false,
                timer: 1500
              });
              resolve();
            }
          });
        }
      });
    }
  });
}

//return approval from admin side
function returnApprove(rtnId,usrId,odrId,totalamt){
  $.ajax({
    method: 'post',
    url: "/admin/return-item",
    data: { returnId:rtnId,
            userId:usrId ,
            orderId:odrId,
            totalAmount:totalamt},
    success: async (response) => {
      if(response.status){
        Swal.fire({
          title: "Success!",
          text: "Return request is approved and " + response.amountToWallet + " amount is returned to the user's wallet.",
          icon: "success",
          showConfirmButton: true,
        }).then(() => {
          location.reload();
        });
      }
    },
    error: (error) => { 
      console.log(JSON.stringify(error));
      Swal.fire({
        title: "Failed to approve!",
        text: "An error occurred while approving return.",
        icon: "error",
        showConfirmButton: false,
        timer: 1500
      });
      resolve();
    }

  })
}


