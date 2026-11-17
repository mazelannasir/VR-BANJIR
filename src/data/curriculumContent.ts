import { CameraPreset, QuizQuestion, StationConcept } from '../types/simulation';

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'overview',
    label: 'Lembah Penuh',
    position: [36, 25, 42],
    target: [0, 2.5, 0],
  },
  {
    id: 'hillside',
    label: 'Cerun & Hutan',
    position: [-8, 17, 24],
    target: [-21, 5.5, -2],
  },
  {
    id: 'urban',
    label: 'Bandar & Turapan',
    position: [28, 13, 22],
    target: [13, 3.5, 2],
  },
  {
    id: 'drainage',
    label: 'Longkang & Jambatan',
    position: [10, 9.5, 19],
    target: [2, 2.5, 6],
  },
  {
    id: 'retention',
    label: 'Kolam Takungan',
    position: [-2, 13, 35],
    target: [-10, 2.5, 18],
  },
];

export const STATIONS: StationConcept[] = [
  {
    id: 'deforestation',
    number: '01',
    title: 'Penebangan Hutan & Hakisan Cerun',
    subtitle: 'Zon Hulu & Tadahan Hujan',
    conceptTag: 'Intersepsi Kanopi & Akar Pokok',
    explanation:
      'Kanopi pokok hutan memintas titisan hujan sementara sistem akar mengikat struktur tanah dan meningkatkan kadar resapan air (infiltrasi). Apabila bukit digondolkan untuk pembinaan, tanah terdedah terus kepada hentaman hujan lebat.',
    scientificFact:
      'Tanpa litupan tumbuhan, kadar larian permukaan meningkat sehingga 4 kali ganda dan membawa kelodak tanah ke dalam sungai.',
    worldPosition: [-20, 7.6, -4],
    cameraPosition: [-8, 16, 15],
    cameraTarget: [-20, 6.2, -4],
  },
  {
    id: 'impervious',
    number: '02',
    title: 'Permukaan Tidak Telap Air',
    subtitle: 'Zon Pembangunan Bandar & Jalan Raya',
    conceptTag: 'Infiltrasi vs. Larian Permukaan',
    explanation:
      'Konkrit, asfalt dan bumbung bangunan bersifat tidak telap air. Air hujan tidak dapat meresap ke dalam tanah bawah dan terpaksa mengalir laju di atas permukaan jalan menuju ke sistem perparitan dan sungai.',
    scientificFact:
      'Di bandar berkonkrit padat, hampir 80%–90% air hujan menjadi larian permukaan berbanding hanya ~15% di hutan semula jadi.',
    worldPosition: [14, 4.3, -3],
    cameraPosition: [26, 13, 14],
    cameraTarget: [14, 4.0, -3],
  },
  {
    id: 'siltation',
    number: '03',
    title: 'Pemendapan Kelodak & Longkang Tersumbat',
    subtitle: 'Sistem Perparitan & Dasar Sungai',
    conceptTag: 'Kapasiti Tampungan Sungai',
    explanation:
      'Kelodak dari tapak pembinaan serta sampah pepejal yang dibuang ke dalam longkang menghalang aliran air. Mendapan kelodak di dasar sungai menjadikan sungai semakin cetek dan mudah melimpah apabila hujan lebat.',
    scientificFact:
      'Sungai yang cetek akibat pemendapan kelodak kehilangan sehingga 40% isipadu tampungan airnya, mencetuskan banjir kilat.',
    worldPosition: [5.8, 3.6, 8],
    cameraPosition: [14, 9.5, 19],
    cameraTarget: [3.5, 2.8, 7.5],
  },
  {
    id: 'wetland',
    number: '04',
    title: 'Tanah Paya & Kolam Takungan Banjir',
    subtitle: 'Zon Penampan Hidrologi Hilir',
    conceptTag: 'Penyerapan Lebihan Air Hujan',
    explanation:
      'Kawasan tanah lembap semula jadi bertindak seperti span gergasi yang menakung lebihan air sungai ketika puncak hujan. Penambakan kawasan ini untuk projek perumahan menghilangkan zon penampan banjir.',
    scientificFact:
      'Kolam takungan kejuruteraan moden menyimpan air sementara semasa hujan lebat dan melepaskannya secara terkawal selepas ribut reda.',
    worldPosition: [-10.5, 2.5, 19],
    cameraPosition: [2, 12.5, 34],
    cameraTarget: [-10.5, 2.5, 19],
  },
  {
    id: 'mitigation',
    number: '05',
    title: 'Teknologi Hijau & Tebatan Banjir',
    subtitle: 'Penyelesaian Kejuruteraan Lestari',
    conceptTag: 'Turapan Telap Air & Penghutanan Semula',
    explanation:
      'Pembangunan mampan menggabungkan turapan telap air (permeable pavement), taman hujan, penghutanan semula cerun bukit, serta pembinaan benteng tebatan banjir bagi mengimbangi kemajuan bandar dengan kelestarian alam.',
    scientificFact:
      'Turapan telap air membenarkan air hujan meresap melalui liang batuan ke lapisan akuifer bawah tanah, mengurangkan beban longkang bandar.',
    worldPosition: [10.5, 4.0, 9.5],
    cameraPosition: [22, 11.5, 22],
    cameraTarget: [10.5, 3.6, 9.5],
  },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question:
      'Mengapakah kawasan bandar yang dilitupi asfalt dan konkrit lebih mudah mengalami banjir kilat berbanding kawasan hutan?',
    options: [
      'Permukaan tidak telap air menghalang infiltrasi dan meningkatkan larian permukaan dengan mendadak.',
      'Asfalt dan konkrit menarik lebih banyak awan hujan ke kawasan bandar.',
      'Pokok hutan menghalang air daripada mengalir ke sungai dengan cara membekukannya.',
      'Bangunan tinggi meningkatkan kadar sejatan air bawah tanah secara langsung.',
    ],
    correctIndex: 0,
    explanation:
      'Betul! Asfalt dan konkrit bersifat tidak telap air, menyebabkan air hujan tidak dapat meresap ke dalam tanah (infiltrasi) lalu mengalir deras sebagai larian permukaan ke longkang dan sungai.',
    relatedStation: 'impervious',
  },
  {
    id: 2,
    question:
      'Apakah kesan utama penebangan hutan di cerun bukit terhadap dasar sungai di kawasan hilir?',
    options: [
      'Air sungai menjadi lebih jernih dan dalam kerana tiada daun gugur.',
      'Hakisan tanah menghasilkan kelodak yang mendap di dasar sungai lalu menjadikannya cetek.',
      'Akar pokok yang mati menyerap semua air sungai sehingga sungai kering kontang.',
      'Kadar resapan air ke dalam akuifer bawah tanah meningkat dengan tinggi.',
    ],
    correctIndex: 1,
    explanation:
      'Tepat! Tanpa akar pokok untuk mencengkam tanah, air hujan menghakis tanah cerun dan membawa kelodak ke sungai. Pemendapan kelodak mencetekkan dasar sungai dan mengurangkan kapasiti tampungannya.',
    relatedStation: 'deforestation',
  },
  {
    id: 3,
    question:
      'Antara langkah teknologi hijau berikut, yang manakah paling berkesan untuk menggabungkan pembangunan bandar dengan pengurangan risiko banjir?',
    options: [
      'Menimbus semua kawasan paya bakau dan tanah lembap untuk membina jalan raya lebih lebar.',
      'Menggantikan semua taman awam dengan kawasan parkir berturap konkrit padu.',
      'Menggunakan turapan telap air, membina kolam takungan banjir serta menanam semula pokok di cerun.',
      'Membuang sisa binaan ke dalam longkang monsun supaya aliran air lebih perlahan.',
    ],
    correctIndex: 2,
    explanation:
      'Cemerlang! Gabungan turapan telap air (meningkatkan resapan), kolam takungan (menyimpan puncak aliran air) dan penghutanan semula cerun (menahan hakisan) adalah teras pembangunan lestari.',
    relatedStation: 'mitigation',
  },
];
