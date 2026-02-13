function openCouponModal() {
    document.getElementById('couponModal').style.display = 'flex';
  
}


function closeModal() {
    document.getElementById('couponModal').style.display = 'none';
}


document.getElementById('couponForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const isDiscountValid = validateDiscountAmount();
    const isMinAmountValid = validateMinAmount();
    const isUsageLimitValid = validateUsageLimit();

    if (!isDiscountValid || !isMinAmountValid || !isUsageLimitValid) {
        return; 
    }

    const couponData = {
        couponCode: document.getElementById('couponCode').value,
        discountType: document.getElementById('discountType').value,
        discountAmount: parseFloat(document.getElementById('discountAmount').value),
        minAmount: parseFloat(document.getElementById('minAmount').value),
        usageLimit: parseFloat(document.getElementById('maxAmount').value),
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
    };

    const validationErrors = validateCouponData(couponData);
    if (validationErrors.length > 0) {
        validationErrors.forEach(error => {
            document.getElementById(error.field).innerText = error.message;
        });
        return;
    }

    try {
        const response = await axios.post('/admin/addCoupon', couponData);
    
        await Swal.fire({
            title: 'Success!',
            text: response.data.message,
            icon: 'success',
            confirmButtonText: 'OK'
        });
        location.reload();
        closeModal();
    } catch (error) {
        await Swal.fire({
            title: 'Error!',
            text: error.response?.data?.message || 'Error adding coupon',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
});

function validateCouponData(data) {
    const errors = [];
    const today = new Date().toISOString().split('T')[0];

    if (data.startDate < today) {
        errors.push({ field: 'startDateError', message: 'Start date cannot be in the past.' });
    }

    if (data.endDate < data.startDate) {
        errors.push({ field: 'endDateError', message: 'End date cannot be before start date.' });
    }

    return errors;
}


// ---------------edit
function formatDateToInputValue(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; 
}

function openEditCouponModal(id, code, discountType, discountAmount, minAmount, maxAmount, startDate, endDate) {
    document.getElementById('editCouponModal').style.display = 'flex';
    document.getElementById('editCouponId').value = id;
    document.getElementById('editCouponCode').value = code;
    document.getElementById('editDiscountType').value = discountType;
    document.getElementById('editDiscountAmount').value = discountAmount;
    document.getElementById('editMinAmount').value = minAmount || 0;
    document.getElementById('editMaxAmount').value = maxAmount || 0;

    document.getElementById('editStartDate').value = startDate ? formatDateToInputValue(startDate) : '';
    document.getElementById('editEndDate').value = endDate ? formatDateToInputValue(endDate) : '';
}




function closeEditModal() {
    document.getElementById('editCouponModal').style.display = 'none';
}

document.getElementById('editCouponForm').addEventListener('submit', async function (e) {
    e.preventDefault(); 

 
    const isDiscountValid = validateEditDiscountAmount();
    const isMinAmountValid = validateEditMinAmount();
    const isUsageLimitValid = validateEditUsageLimit();
    const areDatesValid = validateDates();

    if (!isDiscountValid || !isMinAmountValid || !isUsageLimitValid || !areDatesValid) {
        return;
    }

    const couponData = {
        couponId: document.getElementById('editCouponId').value,
        couponCode: document.getElementById('editCouponCode').value,
        discountType: document.getElementById('editDiscountType').value,
        discountAmount: parseFloat(document.getElementById('editDiscountAmount').value),
        minAmount: parseFloat(document.getElementById('editMinAmount').value),
        usageLimit: parseFloat(document.getElementById('editMaxAmount').value),
        startDate: document.getElementById('editStartDate').value,
        endDate: document.getElementById('editEndDate').value,
    };

   

    try {
        const response = await axios.patch(`/admin/coupon/edit/${couponData.couponId}`, couponData);
        await Swal.fire({
            title: 'Success!',
            text: response.data.message,
            icon: 'success',
            confirmButtonText: 'OK',
        });
        location.reload(); 
    } catch (error) {
        await Swal.fire({
            title: 'Error!',
            text: error.response?.data?.message || 'Error editing coupon',
            icon: 'error',
            confirmButtonText: 'OK',
        });
    }
});
async function deleteCoupon(couponId) {
  
    const { value: confirmed } = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    });

    if (confirmed) {
        try {
            const response = await axios.delete(`/admin/coupon/delete/${couponId}`);
            Swal.fire({
                icon: 'success',
                title: response.data.message,
                showConfirmButton: false,
                timer: 1500
            });
            location.reload(); 
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error deleting coupon',
                text: error.response.data.message || 'An unexpected error occurred.'
            });
        }
    }
}