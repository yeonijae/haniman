import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vipyakvxzfccytwjaqet.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpcHlha3Z4emZjY3l0d2phcWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTc2MjUsImV4cCI6MjA3ODUzMzYyNX0.xuR3LxaR69t1RGB74G3FtlBIoxelfAH6fdZrnZSjHfQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTreatmentItems() {
  console.log('🔍 treatment_items 테이블 조회 중...\n');

  const { data, error } = await supabase
    .from('treatment_items')
    .select('*')
    .order('id');

  if (error) {
    console.error('❌ 오류:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('📋 등록된 치료항목이 없습니다.');
    return;
  }

  console.log(`📋 총 ${data.length}개의 치료항목:\n`);
  console.table(data);

  console.log('\n상세 정보:');
  data.forEach((item, index) => {
    console.log(`${index + 1}. ID: ${item.id}, 이름: ${item.name}, 기본시간: ${item.default_duration}분`);
  });
}

checkTreatmentItems().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('❌ 실행 오류:', err);
  process.exit(1);
});
