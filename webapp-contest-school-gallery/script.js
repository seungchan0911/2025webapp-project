// 앱 상태 관리
const state = {
    photos: [],
    pendingPhotos: [],
    isAdmin: false,
    selectedFile: null
};

// LocalStorage 키
const STORAGE_KEYS = {
    PHOTOS: 'school_gallery_photos',
    PENDING: 'school_gallery_pending'
};

// DOM 요소 캐싱
const elements = {};

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    cacheElements();
    loadData();
    initEventListeners();
    renderGallery();
    updateStats();
});

// DOM 요소 캐싱
function cacheElements() {
    elements.uploadBtn = document.getElementById('uploadBtn');
    elements.adminBtn = document.getElementById('adminBtn');
    elements.uploadModal = document.getElementById('uploadModal');
    elements.adminModal = document.getElementById('adminModal');
    elements.viewerModal = document.getElementById('viewerModal');
    elements.uploadForm = document.getElementById('uploadForm');
    elements.fileInput = document.getElementById('fileInput');
    elements.uploadZone = document.getElementById('uploadZone');
    elements.previewImage = document.getElementById('previewImage');
    elements.submitBtn = document.querySelector('.btn-submit');
    elements.adminPassword = document.getElementById('adminPassword');
    elements.loginBtn = document.getElementById('loginBtn');
    elements.logoutBtn = document.getElementById('logoutBtn');
    elements.adminLogin = document.getElementById('adminLogin');
    elements.adminDashboard = document.getElementById('adminDashboard');
    elements.pendingGrid = document.getElementById('pendingGrid');
    elements.pendingBadge = document.getElementById('pendingBadge');
    elements.noPending = document.getElementById('noPending');
    elements.approvedGrid = document.getElementById('approvedGrid');
    elements.approvedBadge = document.getElementById('approvedBadge');
    elements.noApproved = document.getElementById('noApproved');
    elements.galleryGrid = document.getElementById('galleryGrid');
    elements.emptyState = document.getElementById('emptyState');
    elements.photoCount = document.getElementById('photoCount');
    elements.yearFilter = document.getElementById('yearFilter');
    elements.viewerImage = document.getElementById('viewerImage');
    elements.viewerDate = document.getElementById('viewerDate');
    elements.toast = document.getElementById('toast');
}

// 이벤트 리스너 초기화
function initEventListeners() {
    // 업로드 모달
    elements.uploadBtn.addEventListener('click', () => openModal('uploadModal'));
    
    // 관리자 모달
    elements.adminBtn.addEventListener('click', () => openModal('adminModal'));
    
    // 모달 닫기
    document.querySelectorAll('.btn-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.currentTarget.dataset.modal;
            closeModal(modalId);
        });
    });
    
    // 모달 배경 클릭시 닫기
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // 파일 업로드
    elements.uploadZone.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // 드래그 앤 드롭
    elements.uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadZone.classList.add('dragging');
    });
    
    elements.uploadZone.addEventListener('dragleave', () => {
        elements.uploadZone.classList.remove('dragging');
    });
    
    elements.uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadZone.classList.remove('dragging');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    // 업로드 폼 제출
    elements.uploadForm.addEventListener('submit', handleUploadSubmit);
    
    // 관리자 로그인
    elements.loginBtn.addEventListener('click', handleAdminLogin);
    elements.adminPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAdminLogin();
    });
    
    // 관리자 로그아웃
    elements.logoutBtn.addEventListener('click', handleAdminLogout);
    
    // 연도 필터
    elements.yearFilter.addEventListener('change', renderGallery);
}

// 데이터 로드
function loadData() {
    const photos = localStorage.getItem(STORAGE_KEYS.PHOTOS);
    const pending = localStorage.getItem(STORAGE_KEYS.PENDING);
    
    if (photos) {
        state.photos = JSON.parse(photos);
    } else {
        // 샘플 데이터
        state.photos = generateSamplePhotos();
        saveData();
    }
    
    if (pending) {
        state.pendingPhotos = JSON.parse(pending);
    }
}

// 샘플 사진 생성
function generateSamplePhotos() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const years = [2020, 2021, 2022, 2023, 2024];
    const photos = [];
    
    for (let i = 0; i < 8; i++) {
        const width = 300;
        const height = 300 + Math.floor(Math.random() * 200);
        const color = colors[i % colors.length];
        const year = years[Math.floor(Math.random() * years.length)];
        
        photos.push({
            id: `sample_${i}`,
            url: `data:image/svg+xml;base64,${btoa(`
                <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                    <rect width="${width}" height="${height}" fill="${color}"/>
                    <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dy=".3em">
                        ${year}
                    </text>
                </svg>
            `)}`,
            year: year,
            date: `${year}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
            width: width,
            height: height,
            likes: Math.floor(Math.random() * 50)
        });
    }
    
    return photos;
}

// 데이터 저장
function saveData() {
    localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(state.photos));
    localStorage.setItem(STORAGE_KEYS.PENDING, JSON.stringify(state.pendingPhotos));
}

// 갤러리 렌더링
function renderGallery() {
    const filterYear = elements.yearFilter.value;
    let photosToShow = [...state.photos];
    
    // 연도 필터링
    if (filterYear !== 'all') {
        photosToShow = photosToShow.filter(photo => photo.year === parseInt(filterYear));
    }
    
    // 최신순 정렬
    photosToShow.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 갤러리 렌더링
    elements.galleryGrid.innerHTML = '';
    
    if (photosToShow.length === 0) {
        elements.emptyState.classList.add('show');
    } else {
        elements.emptyState.classList.remove('show');
        
        photosToShow.forEach((photo, index) => {
            const item = createGalleryItem(photo, index);
            elements.galleryGrid.appendChild(item);
        });
    }
    
    updateStats();
}

// 갤러리 아이템 생성
function createGalleryItem(photo, index) {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    div.style.animationDelay = `${index * 0.05}s`;
    
    div.innerHTML = `
        <div class="gallery-card">
            <img src="${photo.url}" alt="School Memory">
            <div class="gallery-info">
                <span class="gallery-date">${formatDate(photo.date)}</span>
            </div>
            <div class="gallery-overlay">
                <button class="like-btn ${isLiked(photo.id) ? 'liked' : ''}" data-photo-id="${photo.id}" onclick="toggleLike(event, '${photo.id}')">
                    좋아요 ${photo.likes || 0}
                </button>
            </div>
        </div>
    `;
    
    // 이미지 클릭시 뷰어 열기
    const img = div.querySelector('img');
    img.addEventListener('click', () => openPhotoViewer(photo));
    
    return div;
}

// 날짜 포맷
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}. ${month}. ${day}.`;
}

// 통계 업데이트
function updateStats() {
    elements.photoCount.textContent = state.photos.length;
    elements.pendingBadge.textContent = state.pendingPhotos.length;
    if (elements.approvedBadge) {
        elements.approvedBadge.textContent = state.photos.length;
    }
}

// 모달 열기
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
    
    if (modalId === 'adminModal' && state.isAdmin) {
        showAdminDashboard();
    }
}

// 모달 닫기
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
    
    if (modalId === 'uploadModal') {
        resetUploadForm();
    }
}

// 파일 선택
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

// 파일 처리
function handleFile(file) {
    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
        showToast('이미지 파일만 업로드 가능합니다');
        return;
    }
    
    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
        showToast('파일 크기는 10MB 이하여야 합니다');
        return;
    }
    
    state.selectedFile = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        elements.previewImage.src = e.target.result;
        elements.previewImage.hidden = false;
        elements.uploadZone.querySelector('.upload-content').hidden = true;
        elements.submitBtn.disabled = false;
    };
    reader.readAsDataURL(file);
}

// 업로드 폼 리셋
function resetUploadForm() {
    elements.fileInput.value = '';
    elements.previewImage.src = '';
    elements.previewImage.hidden = true;
    elements.uploadZone.querySelector('.upload-content').hidden = false;
    elements.submitBtn.disabled = true;
    state.selectedFile = null;
}

// 업로드 제출
function handleUploadSubmit(e) {
    e.preventDefault();
    
    if (!state.selectedFile) {
        showToast('파일을 선택해주세요');
        return;
    }
    
    const now = new Date();
    const photo = {
        id: `photo_${Date.now()}`,
        url: elements.previewImage.src,
        year: now.getFullYear(),
        date: now.toISOString().split('T')[0],
        width: 300,
        height: 300 + Math.floor(Math.random() * 200),
        likes: 0
    };
    
    // 대기 목록에 추가
    state.pendingPhotos.push(photo);
    saveData();
    updateStats();
    
    showToast('사진이 업로드되었습니다. 관리자 승인을 기다려주세요.');
    closeModal('uploadModal');
    
    if (state.isAdmin) {
        renderPendingPhotos();
    }
}

// 관리자 로그인
function handleAdminLogin() {
    const password = elements.adminPassword.value;
    
    if (password === 'admin123') {
        state.isAdmin = true;
        showAdminDashboard();
        showToast('관리자로 로그인했습니다');
    } else {
        showToast('비밀번호가 틀렸습니다');
    }
    
    elements.adminPassword.value = '';
}

// 관리자 로그아웃
function handleAdminLogout() {
    state.isAdmin = false;
    elements.adminLogin.hidden = false;
    elements.adminDashboard.hidden = true;
    showToast('로그아웃되었습니다');
}

// 관리자 대시보드 표시
function showAdminDashboard() {
    elements.adminLogin.hidden = true;
    elements.adminDashboard.hidden = false;
    renderPendingPhotos();
    renderApprovedPhotos();
}

// 대기중인 사진 렌더링
function renderPendingPhotos() {
    elements.pendingGrid.innerHTML = '';
    
    if (state.pendingPhotos.length === 0) {
        elements.noPending.style.display = 'block';
        elements.pendingGrid.style.display = 'none';
    } else {
        elements.noPending.style.display = 'none';
        elements.pendingGrid.style.display = 'grid';
        
        state.pendingPhotos.forEach(photo => {
            const item = createPendingItem(photo);
            elements.pendingGrid.appendChild(item);
        });
    }
    
    updateStats();
}

// 대기 아이템 생성
function createPendingItem(photo) {
    const div = document.createElement('div');
    div.className = 'pending-item';
    
    div.innerHTML = `
        <img src="${photo.url}" alt="Pending">
        <div class="pending-actions">
            <button class="btn-approve" onclick="approvePhoto('${photo.id}')">승인</button>
            <button class="btn-reject" onclick="rejectPhoto('${photo.id}')">거절</button>
        </div>
    `;
    
    return div;
}

// 사진 승인
function approvePhoto(photoId) {
    const index = state.pendingPhotos.findIndex(p => p.id === photoId);
    if (index !== -1) {
        const photo = state.pendingPhotos[index];
        state.photos.push(photo);
        state.pendingPhotos.splice(index, 1);
        saveData();
        renderGallery();
        renderPendingPhotos();
        showToast('사진이 승인되었습니다');
    }
}

// 사진 거절
function rejectPhoto(photoId) {
    const index = state.pendingPhotos.findIndex(p => p.id === photoId);
    if (index !== -1) {
        state.pendingPhotos.splice(index, 1);
        saveData();
        renderPendingPhotos();
        showToast('사진이 거절되었습니다');
    }
}

// 승인된 사진 렌더링
function renderApprovedPhotos() {
    elements.approvedGrid.innerHTML = '';
    
    if (state.photos.length === 0) {
        elements.noApproved.style.display = 'block';
        elements.approvedGrid.style.display = 'none';
    } else {
        elements.noApproved.style.display = 'none';
        elements.approvedGrid.style.display = 'grid';
        
        // 최신순 정렬
        const sortedPhotos = [...state.photos].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedPhotos.forEach(photo => {
            const item = createApprovedItem(photo);
            elements.approvedGrid.appendChild(item);
        });
    }
    
    updateStats();
}

// 승인된 아이템 생성
function createApprovedItem(photo) {
    const div = document.createElement('div');
    div.className = 'pending-item';
    
    div.innerHTML = `
        <img src="${photo.url}" alt="Approved">
        <div class="pending-actions">
            <button class="btn-delete" onclick="deletePhoto('${photo.id}')">삭제</button>
        </div>
    `;
    
    return div;
}

// 사진 삭제
function deletePhoto(photoId) {
    if (!confirm('정말 이 사진을 삭제하시겠습니까?')) {
        return;
    }
    
    const index = state.photos.findIndex(p => p.id === photoId);
    if (index !== -1) {
        state.photos.splice(index, 1);
        saveData();
        renderGallery();
        renderApprovedPhotos();
        showToast('사진이 삭제되었습니다');
    }
}

// 사진 뷰어 열기
function openPhotoViewer(photo) {
    elements.viewerImage.src = photo.url;
    elements.viewerDate.textContent = formatDate(photo.date);
    openModal('viewerModal');
}

// 토스트 메시지
function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// 좋아요 토글
function toggleLike(event, photoId) {
    event.stopPropagation(); // 이미지 뷰어 열기 방지
    
    const photo = state.photos.find(p => p.id === photoId);
    if (!photo) return;
    
    // 좋아요 상태 확인
    const likedPhotos = JSON.parse(localStorage.getItem('liked_photos') || '[]');
    const isCurrentlyLiked = likedPhotos.includes(photoId);
    
    if (isCurrentlyLiked) {
        // 좋아요 취소
        photo.likes = Math.max(0, (photo.likes || 0) - 1);
        const index = likedPhotos.indexOf(photoId);
        likedPhotos.splice(index, 1);
    } else {
        // 좋아요 추가
        photo.likes = (photo.likes || 0) + 1;
        likedPhotos.push(photoId);
    }
    
    // 저장
    localStorage.setItem('liked_photos', JSON.stringify(likedPhotos));
    saveData();
    
    // UI 업데이트
    const btn = event.currentTarget;
    
    if (isCurrentlyLiked) {
        btn.classList.remove('liked');
    } else {
        btn.classList.add('liked');
    }
    
    btn.textContent = `좋아요 ${photo.likes || 0}`;
}

// 좋아요 상태 확인
function isLiked(photoId) {
    const likedPhotos = JSON.parse(localStorage.getItem('liked_photos') || '[]');
    return likedPhotos.includes(photoId);
}

// 전역 함수로 노출 (인라인 이벤트용)
window.approvePhoto = approvePhoto;
window.rejectPhoto = rejectPhoto;
window.deletePhoto = deletePhoto;
window.toggleLike = toggleLike;