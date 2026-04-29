// Family tree data for Họ Đoàn - Complete data from CụLiễu.docx
// Each person has: name, gender (male/female/ancestor/other), children[]

export interface Person {
  name: string;
  gender: 'male' | 'female' | 'ancestor' | 'other';
  children?: Person[];
}

export const familyTree: Person = {
  name: "Cụ ô Liễu M20.10-Cụ B.Hàng (hiệu Từ Cần) M4.7",
  gender: "ancestor",
  children: [
    {
      name: "Cụ Rũng M16.10–Cụ.B.Hàng (hiệu Từ Tâm) M25.10",
      gender: "ancestor",
      children: [
        {
          name: "I. Cụ Hán M6.5-B1 Đức M19.8, B2 Ruyên M17.7, B3 Lý M11.9",
          gender: "ancestor",
          children: [
            {
              name: "B.Tọa CB1(lấy ô Tuyển)",
              gender: "female",
              children: [
                {
                  name: "ô Vĩnh",
                  gender: "male",
                  children: [
                    {
                      name: "b Phương",
                      gender: "female",
                    },
                    {
                      name: "ô Trị",
                      gender: "male",
                    },
                    {
                      name: "ô Hai",
                      gender: "male",
                    },
                    {
                      name: "ô Láng (vọng Họ Đoàn)",
                      gender: "male",
                      children: [
                        {
                          name: "ô Thâm-VB1 Bé, b2",
                          gender: "male",
                          children: [
                            {
                              name: "ô Tuấn CB1",
                              gender: "male",
                            },
                            {
                              name: "b Thúy",
                              gender: "female",
                            }
                          ]
                        },
                        {
                          name: "ô Sản",
                          gender: "male",
                        },
                        {
                          name: "b Hợi",
                          gender: "female",
                        }
                      ]
                    },
                    {
                      name: "b Thọ",
                      gender: "female",
                    }
                  ]
                }
              ]
            },
            {
              name: "Bà CB1 lấy bố ô xã Thiều",
              gender: "female",
              children: [
                {
                  name: "ô Thiều",
                  gender: "male",
                  children: [
                    {
                      name: "Đẻ ngành ô Nghiễm, ô Bạn Họ Ngọ",
                      gender: "other",
                    }
                  ]
                }
              ]
            },
            {
              name: "Bà CB1 lấy bố ô Hạp Thôn Hội",
              gender: "female",
              children: [
                {
                  name: "ô Hạp",
                  gender: "male",
                  children: [
                    {
                      name: "ô Chưng T.Hội",
                      gender: "male",
                    }
                  ]
                }
              ]
            },
            {
              name: "Bà CB1 lấy bố ô Gừng T.K.Kiều",
              gender: "female",
              children: [
                {
                  name: "ô Gừng",
                  gender: "male",
                  children: [
                    {
                      name: "ô Hạ T.K.Kiều",
                      gender: "male",
                    }
                  ]
                }
              ]
            },
            {
              name: "Bà CB1 lấy bố ô Hường T.Hòa Bình",
              gender: "female",
              children: [
                {
                  name: "ô Hường",
                  gender: "male",
                  children: [
                    {
                      name: "Đẻ ngành ô Tước",
                      gender: "other",
                    }
                  ]
                }
              ]
            },
            {
              name: "B Tiếp CB2",
              gender: "female",
              children: [
                {
                  name: "ô Chước",
                  gender: "male",
                },
                {
                  name: "ô Trữ",
                  gender: "male",
                },
                {
                  name: "ô Trục",
                  gender: "male",
                }
              ]
            },
            {
              name: "1.ô Thiệu CB2– B.Trịnh",
              gender: "male",
              children: [
                {
                  name: "ô Tự-B1.Gắt, B2.Niên, B3.Phớt, B4.Chi (B2,3,4 k.con)",
                  gender: "male",
                  children: [
                    {
                      name: "b Nương CB1 lấy ô Đoàn bên Sự",
                      gender: "female",
                    },
                    {
                      name: "ô Tỵ CB11- B.Lạch",
                      gender: "male",
                      children: [
                        {
                          name: "ô Thân (chết sớm)",
                          gender: "male",
                        },
                        {
                          name: "b Gái lấy ck ngành ô Tứ X12",
                          gender: "female",
                        },
                        {
                          name: "b Lơ",
                          gender: "female",
                        },
                        {
                          name: "b Trí lấy chồng trên Quán",
                          gender: "female",
                        },
                        {
                          name: "ô Đạm – B.Bé",
                          gender: "male",
                          children: [
                            {
                              name: "b Phương lấy a Bằng trên Quán",
                              gender: "female",
                            },
                            {
                              name: "ô Cẩm- B.Phấn ở HN",
                              gender: "male",
                              children: [
                                {
                                  name: "b Mai lấy chồng Hà Nội",
                                  gender: "female",
                                },
                                {
                                  name: "ô Nam-B.Hoa",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "b Minh Anh",
                                      gender: "female",
                                    },
                                    {
                                      name: "b Minh Vi",
                                      gender: "female",
                                    }
                                  ]
                                }
                              ]
                            },
                            {
                              name: "ô Diên-B.Thúy",
                              gender: "male",
                              children: [
                                {
                                  name: "ô Anh – B.Phượng ở Đức",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "ô Việt Anh",
                                      gender: "male",
                                    },
                                    {
                                      name: "ô Bảo An",
                                      gender: "male",
                                    }
                                  ]
                                },
                                {
                                  name: "b Yến (Én) lấy chổng đang bên Đức",
                                  gender: "female",
                                }
                              ]
                            },
                            {
                              name: "ô Thạch-B.Dung",
                              gender: "male",
                              children: [
                                {
                                  name: "ô Tuấn",
                                  gender: "male",
                                },
                                {
                                  name: "b Thảo",
                                  gender: "female",
                                }
                              ]
                            }
                          ]
                        },
                        {
                          name: "b Khuyên lấy ô Thú T.lộc",
                          gender: "female",
                        },
                        {
                          name: "ô Thạc-B1 Thủy,B2 Hương",
                          gender: "male",
                          children: [
                            {
                              name: "ô Cường CB1",
                              gender: "male",
                            },
                            {
                              name: "ô Hùng CB1",
                              gender: "male",
                            },
                            {
                              name: "ô Dũng CB1",
                              gender: "male",
                            },
                            {
                              name: "ô Ruy (CB1) –B.Lanh",
                              gender: "male",
                              children: [
                                {
                                  name: "Rúc lớn",
                                  gender: "other",
                                },
                                {
                                  name: "Rúc con",
                                  gender: "other",
                                }
                              ]
                            },
                            {
                              name: "ô Tuy (con CB1)-B.Nhớn",
                              gender: "male",
                              children: [
                                {
                                  name: "ô Kỷ",
                                  gender: "male",
                                },
                                {
                                  name: "b Tẹo",
                                  gender: "female",
                                },
                                {
                                  name: "b Tẹo con –lấy ô Phốc",
                                  gender: "female",
                                }
                              ]
                            },
                            {
                              name: "ô Dưỡng-B.Chiểu (con nuôi ở HN, lấy Họ Chu)",
                              gender: "male",
                              children: [
                                {
                                  name: "ô Tuấn",
                                  gender: "male",
                                },
                                {
                                  name: "ô Dũng",
                                  gender: "male",
                                },
                                {
                                  name: "ô Kiên",
                                  gender: "male",
                                }
                              ]
                            }
                          ]
                        },
                        {
                          name: "ô Cầu CB2 (cụ Tổng Mao)- B1 Ngữ, B2 Đam",
                          gender: "male",
                          children: [
                            {
                              name: "b Thạnh CB1 (k con)",
                              gender: "female",
                            },
                            {
                              name: "b Trửu CB1 lấy ô An đẻ cô Thi",
                              gender: "female",
                            },
                            {
                              name: "ô Yêng CB1",
                              gender: "male",
                              children: [
                                {
                                  name: "ô Vơn-B.Thóc",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "ô Dũng-B.Thúy",
                                      gender: "male",
                                      children: [
                                        {
                                          name: "b Hà",
                                          gender: "female",
                                        },
                                        {
                                          name: "b Hằng",
                                          gender: "female",
                                        }
                                      ]
                                    },
                                    {
                                      name: "ô Diệp-B.",
                                      gender: "male",
                                    }
                                  ]
                                },
                                {
                                  name: "ô Nhưỡng-B.Tuất",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "ô Minh",
                                      gender: "male",
                                    },
                                    {
                                      name: "ô",
                                      gender: "male",
                                    }
                                  ]
                                },
                                {
                                  name: "b Yến (chết sớm)",
                                  gender: "female",
                                },
                                {
                                  name: "b Xuyến- lấy ô Giáp thôn Hội",
                                  gender: "female",
                                }
                              ]
                            },
                            {
                              name: "ô Hiệt-B.Chiều",
                              gender: "male",
                              children: [
                                {
                                  name: "ô Thoàn-B.Hà",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "b Thương- lấy chồng ở Đức",
                                      gender: "female",
                                    },
                                    {
                                      name: "ô Luân",
                                      gender: "male",
                                    }
                                  ]
                                },
                                {
                                  name: "b Vòng-lấy ô Biên T.Nguyệt Lãng",
                                  gender: "female",
                                }
                              ]
                            },
                            {
                              name: "ô Xuyền-B. Hạ",
                              gender: "male",
                              children: [
                                {
                                  name: "ô",
                                  gender: "male",
                                },
                                {
                                  name: "b",
                                  gender: "female",
                                }
                              ]
                            },
                            {
                              name: "ô Cư CB2-B1 B2",
                              gender: "male",
                              children: [
                                {
                                  name: "ô Tuân CB2–B1, B2 Hợi",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "ô Dực CB1-B.Cần",
                                      gender: "male",
                                      children: [
                                        {
                                          name: "ô Giang-B.",
                                          gender: "male",
                                          children: [
                                            {
                                              name: "ô",
                                              gender: "male",
                                            },
                                            {
                                              name: "ô Sơn",
                                              gender: "male",
                                            },
                                            {
                                              name: "ô",
                                              gender: "male",
                                            }
                                          ]
                                        },
                                        {
                                          name: "ô Ngân CB1-B.",
                                          gender: "male",
                                          children: [
                                            {
                                              name: "ô quân",
                                              gender: "male",
                                            },
                                            {
                                              name: "b",
                                              gender: "female",
                                            }
                                          ]
                                        }
                                      ]
                                    },
                                    {
                                      name: "b Sinh CB2 lấy ô Điền cùng làng",
                                      gender: "female",
                                    },
                                    {
                                      name: "b Phin CB2 lấy ô Tạm ở làng Hội",
                                      gender: "female",
                                    },
                                    {
                                      name: "b Tư CB2 lấy ô Văn ở Khê Kiều",
                                      gender: "female",
                                    },
                                    {
                                      name: "b Nhân",
                                      gender: "female",
                                    }
                                  ]
                                },
                                {
                                  name: "ô Khân CB1(L.sỹ)",
                                  gender: "male",
                                },
                                {
                                  name: "ô Khiên CB2(L.sỹ)",
                                  gender: "male",
                                },
                                {
                                  name: "b Tám",
                                  gender: "female",
                                },
                                {
                                  name: "b Đoài lấy ô Tọa ở La Uyên",
                                  gender: "female",
                                },
                                {
                                  name: "b Đãng",
                                  gender: "female",
                                }
                              ]
                            },
                            {
                              name: "ô Bộ CB2-B.lan",
                              gender: "male",
                              children: [
                                {
                                  name: "ô Kiên-B",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "ô Chung",
                                      gender: "male",
                                    },
                                    {
                                      name: "ô",
                                      gender: "male",
                                    },
                                    {
                                      name: "ô",
                                      gender: "male",
                                    }
                                  ]
                                }
                              ]
                            },
                            {
                              name: "ô Cóng-.B1, B2",
                              gender: "male",
                              children: [
                                {
                                  name: "b CB1",
                                  gender: "female",
                                },
                                {
                                  name: "ô CB2",
                                  gender: "male",
                                },
                                {
                                  name: "b Quang CB2 lấy ô Thông ở Lu",
                                  gender: "female",
                                }
                              ]
                            },
                            {
                              name: "ô Mâu CB2-B.Thuận",
                              gender: "male",
                              children: [
                                {
                                  name: "ô Nhật-B.",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "ô",
                                      gender: "male",
                                    },
                                    {
                                      name: "ô Đức",
                                      gender: "male",
                                    }
                                  ]
                                },
                                {
                                  name: "ô Viên-B.Lự",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "ô Ái-B.Lẹo",
                                      gender: "male",
                                      children: [
                                        {
                                          name: "ô Nhữ-B.Nết",
                                          gender: "male",
                                          children: [
                                            {
                                              name: "ô Hiển-B.Hường",
                                              gender: "male",
                                              children: [
                                                {
                                                  name: "ô Hiếu",
                                                  gender: "male",
                                                },
                                                {
                                                  name: "b Mi",
                                                  gender: "female",
                                                },
                                                {
                                                  name: "b Huyền lấy ô Huy cùng làng",
                                                  gender: "female",
                                                },
                                                {
                                                  name: "b Mai Anh",
                                                  gender: "female",
                                                }
                                              ]
                                            }
                                          ]
                                        },
                                        {
                                          name: "ô Ngự-B.Tuyến",
                                          gender: "male",
                                          children: [
                                            {
                                              name: "ô Hải-B.Linh",
                                              gender: "male",
                                              children: [
                                                {
                                                  name: "ô Bi",
                                                  gender: "male",
                                                },
                                                {
                                                  name: "b",
                                                  gender: "female",
                                                }
                                              ]
                                            },
                                            {
                                              name: "ô Dương-B.",
                                              gender: "male",
                                            }
                                          ]
                                        }
                                      ]
                                    },
                                    {
                                      name: "b Ngư lấy ô Tiếu T.Hội",
                                      gender: "female",
                                    }
                                  ]
                                },
                                {
                                  name: "ô Nghiệp-B.Chiểu",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "ô Công",
                                      gender: "male",
                                    },
                                    {
                                      name: "b Thảo",
                                      gender: "female",
                                    }
                                  ]
                                },
                                {
                                  name: "ô Ngận-B.Trang",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "b Bảo Châu",
                                      gender: "female",
                                    },
                                    {
                                      name: "ô Bảo Khang",
                                      gender: "male",
                                    }
                                  ]
                                },
                                {
                                  name: "ô Thuận-B.Huyền",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "ô Nguyên",
                                      gender: "male",
                                    },
                                    {
                                      name: "ô Nam",
                                      gender: "male",
                                    }
                                  ]
                                },
                                {
                                  name: "ô Mỹ-B.",
                                  gender: "male",
                                },
                                {
                                  name: "ô Đỉnh-B.Nhàn",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "b Bình",
                                      gender: "female",
                                    },
                                    {
                                      name: "b An",
                                      gender: "female",
                                    },
                                    {
                                      name: "ô Định",
                                      gender: "male",
                                    },
                                    {
                                      name: "b Trâm lấy ck ở Giao Thủy",
                                      gender: "female",
                                    },
                                    {
                                      name: "b Oanh lấy ô Hợi trên quán",
                                      gender: "female",
                                    },
                                    {
                                      name: "b Khoanh lấy ô Thắng cùng làng",
                                      gender: "female",
                                    },
                                    {
                                      name: "b Lanh lấy ô Thoan cùng làng",
                                      gender: "female",
                                    },
                                    {
                                      name: "b Vanh lấy ô Uấn cùng làng",
                                      gender: "female",
                                    },
                                    {
                                      name: "b Phối (đi mất)",
                                      gender: "female",
                                    }
                                  ]
                                },
                                {
                                  name: "b Phôi CB2(đi mất)",
                                  gender: "female",
                                },
                                {
                                  name: "b lấy ô Trất xóm dưới",
                                  gender: "female",
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    {
                      name: "b Tửu lấy ô Tỏi cùng làng",
                      gender: "female",
                    },
                    {
                      name: "b Trà lấy ô Tỏi cùng làng",
                      gender: "female",
                    },
                    {
                      name: "b Bàn lấy ô Pháo ở bên Lu",
                      gender: "female",
                    },
                    {
                      name: "b Cát lấy ô Uyên làng Hội",
                      gender: "female",
                    }
                  ]
                }
              ]
            },
            {
              name: "2.ô Mậu CB2-B.Tốn (k con trai)",
              gender: "male",
              children: [
                {
                  name: "b lấy làm 2 ô Thổ",
                  gender: "female",
                },
                {
                  name: "b lấy ô ở Đào Xá",
                  gender: "female",
                },
                {
                  name: "b lấy ông bên Sự",
                  gender: "female",
                },
                {
                  name: "B lấy làm 2 ô Đoàn Đệ",
                  gender: "female",
                }
              ]
            },
            {
              name: "3.ô Ngọan CB2-B.Hiệu",
              gender: "male",
              children: [
                {
                  name: "ô Trân-B.Vỉ",
                  gender: "male",
                  children: [
                    {
                      name: "ô Vi (k con)",
                      gender: "male",
                    },
                    {
                      name: "ô Cấn-B1 Nội, b2 Xuất, b3 Sử",
                      gender: "male",
                      children: [
                        {
                          name: "ô Dân CB2-B",
                          gender: "male",
                          children: [
                            {
                              name: "b Hải lấy ck ở h.Đông Hưng",
                              gender: "female",
                            },
                            {
                              name: "ô Dương-B",
                              gender: "male",
                              children: [
                                {
                                  name: "ô",
                                  gender: "male",
                                }
                              ]
                            }
                          ]
                        },
                        {
                          name: "b Muộn CB2 (k ck)",
                          gender: "female",
                        }
                      ]
                    },
                    {
                      name: "ô Miên CB3-B.",
                      gender: "male",
                      children: [
                        {
                          name: "ô Liểu-B.",
                          gender: "male",
                          children: [
                            {
                              name: "ô",
                              gender: "male",
                            },
                            {
                              name: "ô",
                              gender: "male",
                            },
                            {
                              name: "ô",
                              gender: "male",
                            }
                          ]
                        },
                        {
                          name: "ô Linh-B.",
                          gender: "male",
                          children: [
                            {
                              name: "ô Trưng",
                              gender: "male",
                            },
                            {
                              name: "b Yến Nhi",
                              gender: "female",
                            },
                            {
                              name: "b An Nhi",
                              gender: "female",
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              name: "4.ô Thụy CB2-B.Thiệm",
              gender: "male",
              children: [
                {
                  name: "b Tương",
                  gender: "female",
                },
                {
                  name: "b lấy ô Sáp",
                  gender: "female",
                }
              ]
            },
            {
              name: "5.ô Rao CB2-?",
              gender: "male",
              children: [
                {
                  name: "B Phó Hân",
                  gender: "female",
                },
                {
                  name: "b Hằng CB2 lấy làm 2 Cụ Tuyển",
                  gender: "female",
                }
              ]
            },
            {
              name: "6.ô Nhại CB3-B.Riên",
              gender: "male",
              children: [
                {
                  name: "ô Quỳnh-B.Đường",
                  gender: "male",
                  children: [
                    {
                      name: "ô Điện B1 Nhỡ, B2 Nhớn, B3 Tý",
                      gender: "male",
                      children: [
                        {
                          name: "ô Phơn CB2-B.Tý",
                          gender: "male",
                          children: [
                            {
                              name: "b Hoa lấy ô Kiu cùng làng",
                              gender: "female",
                            },
                            {
                              name: "b Nụ lấy ô Hoán ở Quỳnh Phụ",
                              gender: "female",
                            },
                            {
                              name: "b Đào lấy ô Minh cùng làng",
                              gender: "female",
                            },
                            {
                              name: "ô Thiện-B.Vang (ở HN)",
                              gender: "male",
                              children: [
                                {
                                  name: "b Ngân",
                                  gender: "female",
                                },
                                {
                                  name: "b Phương",
                                  gender: "female",
                                },
                                {
                                  name: "b",
                                  gender: "female",
                                }
                              ]
                            },
                            {
                              name: "ô Thành-B.Hương",
                              gender: "male",
                              children: [
                                {
                                  name: "b Lan lấy ck HN",
                                  gender: "female",
                                },
                                {
                                  name: "b Yến lấy ck làng Hội",
                                  gender: "female",
                                }
                              ]
                            },
                            {
                              name: "ô Long-B.Cúc",
                              gender: "male",
                              children: [
                                {
                                  name: "ô",
                                  gender: "male",
                                }
                              ]
                            }
                          ]
                        },
                        {
                          name: "b Then lấy ô Chiền cùng làng",
                          gender: "female",
                        }
                      ]
                    },
                    {
                      name: "ô Toàn-B.Miến",
                      gender: "male",
                      children: [
                        {
                          name: "ô Quân-B.",
                          gender: "male",
                          children: [
                            {
                              name: "b Vi",
                              gender: "female",
                            }
                          ]
                        },
                        {
                          name: "ô Diện-B.Huệ",
                          gender: "male",
                          children: [
                            {
                              name: "ô Chung-B.Linh ở HN",
                              gender: "male",
                              children: [
                                {
                                  name: "ô",
                                  gender: "male",
                                },
                                {
                                  name: "ô Dũng",
                                  gender: "male",
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    {
                      name: "ô Pha CB3",
                      gender: "male",
                    },
                    {
                      name: "ô Khánh (ở Đức)",
                      gender: "male",
                    },
                    {
                      name: "ô Khanh (ở Đức)",
                      gender: "male",
                    },
                    {
                      name: "ô Khải (ở Đức)",
                      gender: "male",
                    }
                  ]
                },
                {
                  name: "ô Điệp- B1, b2",
                  gender: "male",
                  children: [
                    {
                      name: "ô Hòe CB1",
                      gender: "male",
                    },
                    {
                      name: "ô CB1",
                      gender: "male",
                    },
                    {
                      name: "ô CB2",
                      gender: "male",
                    },
                    {
                      name: "b CB2",
                      gender: "female",
                    }
                  ]
                },
                {
                  name: "ô Hành-B.Nhỡ",
                  gender: "male",
                  children: [
                    {
                      name: "ô Ánh-B.Năng",
                      gender: "male",
                      children: [
                        {
                          name: "b Nhị lấy ck ở Duyên Hà",
                          gender: "female",
                        }
                      ]
                    },
                    {
                      name: "ô Hùng-B.Huệ",
                      gender: "male",
                      children: [
                        {
                          name: "b Thúy lấy ck ở Vĩnh Phúc",
                          gender: "female",
                        }
                      ]
                    },
                    {
                      name: "ô Dương-B.Mai",
                      gender: "male",
                      children: [
                        {
                          name: "ô",
                          gender: "male",
                        },
                        {
                          name: "ô",
                          gender: "male",
                        },
                        {
                          name: "ô",
                          gender: "male",
                        }
                      ]
                    },
                    {
                      name: "b Chanh lấy ck Hà Tây",
                      gender: "female",
                    },
                    {
                      name: "b Chiên lấy ô Tòa làng Hội",
                      gender: "female",
                    },
                    {
                      name: "b Chiến lấy ô Trạch cùng làng",
                      gender: "female",
                    }
                  ]
                },
                {
                  name: "ô Mạnh-B.Nguyêt",
                  gender: "male",
                  children: [
                    {
                      name: "ô Tưởng-B.Hà",
                      gender: "male",
                      children: [
                        {
                          name: "ô",
                          gender: "male",
                        },
                        {
                          name: "b",
                          gender: "female",
                        }
                      ]
                    },
                    {
                      name: "ô Cường",
                      gender: "male",
                    },
                    {
                      name: "ô Báo-B.Nga",
                      gender: "male",
                      children: [
                        {
                          name: "ô Hịệp-B.My",
                          gender: "male",
                        },
                        {
                          name: "b Phương lấy ck ở Bắc Giang",
                          gender: "female",
                        }
                      ]
                    }
                  ]
                },
                {
                  name: "ô Viện-B.Bính",
                  gender: "male",
                  children: [
                    {
                      name: "b Hiền lấy ô Thùy cùng làng",
                      gender: "female",
                    },
                    {
                      name: "ô Hậu-B.Hà",
                      gender: "male",
                      children: [
                        {
                          name: "b Nhung lấy ck ở Thái Thụy",
                          gender: "female",
                        },
                        {
                          name: "b Yến",
                          gender: "female",
                        }
                      ]
                    },
                    {
                      name: "b Hà lấy ck ở làng Nội",
                      gender: "female",
                    },
                    {
                      name: "ô Tuấn-B.Huệ",
                      gender: "male",
                      children: [
                        {
                          name: "ô Tú-B.Anh",
                          gender: "male",
                          children: [
                            {
                              name: "ô Minh",
                              gender: "male",
                            }
                          ]
                        },
                        {
                          name: "ô Cường",
                          gender: "male",
                        }
                      ]
                    },
                    {
                      name: "ô Vũ-B.Gối",
                      gender: "male",
                      children: [
                        {
                          name: "b Mậm",
                          gender: "female",
                        },
                        {
                          name: "b Gái",
                          gender: "female",
                        }
                      ]
                    },
                    {
                      name: "ô Ngọc-B.Phê",
                      gender: "male",
                      children: [
                        {
                          name: "b Còm",
                          gender: "female",
                        },
                        {
                          name: "b Trí",
                          gender: "female",
                        }
                      ]
                    },
                    {
                      name: "b Tửu lấy ô Tỏi cùng làng",
                      gender: "female",
                    },
                    {
                      name: "b Trà lấy ô Tỏi cùng làng",
                      gender: "female",
                    },
                    {
                      name: "b Bàn lấy ô Pháo ở bên Lu",
                      gender: "female",
                    },
                    {
                      name: "b Cát lấy ô Uyên làng Hội",
                      gender: "female",
                    }
                  ]
                }
              ]
            },
            {
              name: "7.ô Triết CB3-B.Gấm",
              gender: "male",
              children: [
                {
                  name: "b Bếp lấy ck ở làng Thông",
                  gender: "female",
                },
                {
                  name: "ô Chính-B.Định",
                  gender: "male",
                  children: [
                    {
                      name: "ô Rĩnh đi miền nam",
                      gender: "male",
                    },
                    {
                      name: "ô Rãng-B.Mây",
                      gender: "male",
                      children: [
                        {
                          name: "b Nhuận lấy ck ở Hải Phòng",
                          gender: "female",
                        },
                        {
                          name: "b Như lấy ô Hán cùng làng",
                          gender: "female",
                        },
                        {
                          name: "ô Nhự-B.Khuyên",
                          gender: "male",
                          children: [
                            {
                              name: "b Hương lấy ô Giới cùng làng",
                              gender: "female",
                            },
                            {
                              name: "ô Đạt (Tuấn)-B.Linh",
                              gender: "male",
                              children: [
                                {
                                  name: "b Hồng Ngân",
                                  gender: "female",
                                },
                                {
                                  name: "ô Anh Tuấn",
                                  gender: "male",
                                }
                              ]
                            }
                          ]
                        },
                        {
                          name: "ô Nhẫn-B.Hằng",
                          gender: "male",
                          children: [
                            {
                              name: "ô Hiếu",
                              gender: "male",
                            },
                            {
                              name: "ô Nghĩa-B",
                              gender: "male",
                              children: [
                                {
                                  name: "ô",
                                  gender: "male",
                                },
                                {
                                  name: "ô",
                                  gender: "male",
                                },
                                {
                                  name: "ô",
                                  gender: "male",
                                }
                              ]
                            }
                          ]
                        },
                        {
                          name: "b Khâu lấy ô Dự cùng làng",
                          gender: "female",
                        },
                        {
                          name: "b Viền (chết sớm)",
                          gender: "female",
                        }
                      ]
                    },
                    {
                      name: "ô Ban",
                      gender: "male",
                    },
                    {
                      name: "ô Khải",
                      gender: "male",
                    },
                    {
                      name: "b Bàn lấy ô Tốn cùng làng",
                      gender: "female",
                    },
                    {
                      name: "b Soạn (chết sớm)",
                      gender: "female",
                    }
                  ]
                },
                {
                  name: "b Huyền",
                  gender: "female",
                }
              ]
            },
            {
              name: "8.ô Đồ Quyến CB3-B.Kiệm",
              gender: "male",
              children: [
                {
                  name: "ô Thục (đi tu ở chùa Cao Mại)",
                  gender: "male",
                },
                {
                  name: "ô Thuần-B1 Tần, B2 Tiện",
                  gender: "male",
                  children: [
                    {
                      name: "ô Hạt CB1-B.Mạc",
                      gender: "male",
                      children: [
                        {
                          name: "ô Uyến-B.Tẻo",
                          gender: "male",
                          children: [
                            {
                              name: "ô Thái-B.Hiền",
                              gender: "male",
                              children: [
                                {
                                  name: "b Vân Anh",
                                  gender: "female",
                                },
                                {
                                  name: "b Khánh Ly",
                                  gender: "female",
                                },
                                {
                                  name: "ô Quang Minh",
                                  gender: "male",
                                }
                              ]
                            },
                            {
                              name: "b Gấm",
                              gender: "female",
                            },
                            {
                              name: "ô Quyết-B.Tâm",
                              gender: "male",
                              children: [
                                {
                                  name: "b Quỳnh Nga",
                                  gender: "female",
                                },
                                {
                                  name: "b Thu Ngân",
                                  gender: "female",
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    {
                      name: "ô La CB2-B.Nhỡ",
                      gender: "male",
                      children: [
                        {
                          name: "ô Riến-B.Ngà",
                          gender: "male",
                          children: [
                            {
                              name: "ô Thuận-B",
                              gender: "male",
                              children: [
                                {
                                  name: "b Bình An",
                                  gender: "female",
                                }
                              ]
                            },
                            {
                              name: "b Hải lấy ck ở Thái Bình",
                              gender: "female",
                            },
                            {
                              name: "b Nhung lấy ck ở",
                              gender: "female",
                            },
                            {
                              name: "b Mít",
                              gender: "female",
                            }
                          ]
                        },
                        {
                          name: "ô Quảng-B.Hợi",
                          gender: "male",
                          children: [
                            {
                              name: "b Hằng lấy ck ở Nguyệt Lãng",
                              gender: "female",
                            },
                            {
                              name: "b Hường lấy ck ở Vũ Chính",
                              gender: "female",
                            },
                            {
                              name: "ô Cảnh-B.Lan",
                              gender: "male",
                              children: [
                                {
                                  name: "ô Phong",
                                  gender: "male",
                                },
                                {
                                  name: "ô Khoa",
                                  gender: "male",
                                }
                              ]
                            }
                          ]
                        },
                        {
                          name: "ô Hưng-B.Dậu",
                          gender: "male",
                          children: [
                            {
                              name: "ô Long-B.Lương",
                              gender: "male",
                              children: [
                                {
                                  name: "ô Thành",
                                  gender: "male",
                                },
                                {
                                  name: "ô Tuấn Anh",
                                  gender: "male",
                                }
                              ]
                            },
                            {
                              name: "b Lan lấy ck ở T.Hòa Bình",
                              gender: "female",
                            },
                            {
                              name: "ô Phụng-B.Huyền",
                              gender: "male",
                              children: [
                                {
                                  name: "b Bảo Ngọc",
                                  gender: "female",
                                },
                                {
                                  name: "ô Thiên Phú",
                                  gender: "male",
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    {
                      name: "ô Ty CB2-B",
                      gender: "male",
                      children: [
                        {
                          name: "b Hạnh lấy ck ở La Uyên",
                          gender: "female",
                        },
                        {
                          name: "b Chung lấy ck ở Tân Hòa",
                          gender: "female",
                        },
                        {
                          name: "ô Chiến-B.Nụ",
                          gender: "male",
                          children: [
                            {
                              name: "b Hiền lấy ck ở Tân Hòa",
                              gender: "female",
                            },
                            {
                              name: "b Hà lấy ck ở Hưng Hà",
                              gender: "female",
                            },
                            {
                              name: "b Yến lấy ck ở Hưng Hà",
                              gender: "female",
                            },
                            {
                              name: "b Phương Anh",
                              gender: "female",
                            }
                          ]
                        }
                      ]
                    },
                    {
                      name: "ô Huyến-B.Mùi",
                      gender: "male",
                      children: [
                        {
                          name: "b Ngoan lấy ck ở Đại Đồng",
                          gender: "female",
                        },
                        {
                          name: "b Sinh lấy ck ở khê Kiều",
                          gender: "female",
                        },
                        {
                          name: "ô Vượng-B1 Mai, B2 Mai",
                          gender: "male",
                          children: [
                            {
                              name: "ô Khánh CB1",
                              gender: "male",
                            },
                            {
                              name: "ô Thịnh CB1",
                              gender: "male",
                            }
                          ]
                        },
                        {
                          name: "ô Yêm",
                          gender: "male",
                        },
                        {
                          name: "b Ngoãn lấy ô Phố T.Hội",
                          gender: "female",
                        },
                        {
                          name: "ô Tuỳnh-B.Tám",
                          gender: "male",
                          children: [
                            {
                              name: "ô Hiếu-B.Tuyết",
                              gender: "male",
                              children: [
                                {
                                  name: "b An Nhiên",
                                  gender: "female",
                                },
                                {
                                  name: "ô",
                                  gender: "male",
                                }
                              ]
                            },
                            {
                              name: "ô Huỳnh-B.Hiền",
                              gender: "male",
                              children: [
                                {
                                  name: "ô Bảo",
                                  gender: "male",
                                },
                                {
                                  name: "ô (chết sớm)",
                                  gender: "male",
                                }
                              ]
                            }
                          ]
                        },
                        {
                          name: "ô Xuyên CB2-B",
                          gender: "male",
                          children: [
                            {
                              name: "ô Phúc-B.Thược",
                              gender: "male",
                              children: [
                                {
                                  name: "b Phương lấy ô Khải cùng làng",
                                  gender: "female",
                                },
                                {
                                  name: "b Chi lấy ck ở Nguyệt Lãng",
                                  gender: "female",
                                },
                                {
                                  name: "ô Đức-B",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "ô",
                                      gender: "male",
                                    }
                                  ]
                                }
                              ]
                            },
                            {
                              name: "ô Cương-B.Hoa",
                              gender: "male",
                              children: [
                                {
                                  name: "b Huyền",
                                  gender: "female",
                                },
                                {
                                  name: "b Thủy lấy ck Phú ở Hn",
                                  gender: "female",
                                }
                              ]
                            }
                          ]
                        },
                        {
                          name: "ô Huấn-B.Hiễn",
                          gender: "male",
                          children: [
                            {
                              name: "ô Luân-B.Lý",
                              gender: "male",
                              children: [
                                {
                                  name: "b Trang lấy ck ở Hà nam",
                                  gender: "female",
                                }
                              ]
                            },
                            {
                              name: "ô Bân-B.Mến",
                              gender: "male",
                              children: [
                                {
                                  name: "b Dung lấy ck ở Tiền Hải",
                                  gender: "female",
                                },
                                {
                                  name: "ô Trường",
                                  gender: "male",
                                }
                              ]
                            }
                          ]
                        },
                        {
                          name: "ô Huân-B.Nhớn",
                          gender: "male",
                          children: [
                            {
                              name: "ô Mược",
                              gender: "male",
                            },
                            {
                              name: "ô Lạng (ở Hoàng Liên Sơn)",
                              gender: "male",
                              children: [
                                {
                                  name: "1trai – 3 gái",
                                  gender: "other",
                                },
                                {
                                  name: "b Lân",
                                  gender: "female",
                                }
                              ]
                            },
                            {
                              name: "ô Đảng (chết sớm)",
                              gender: "male",
                            },
                            {
                              name: "ô Ba (chết sớm)",
                              gender: "male",
                            },
                            {
                              name: "b Gầm (chết sớm)",
                              gender: "female",
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              name: "9.ô Riễn CB3-B.Ngôn",
              gender: "male",
              children: [
                {
                  name: "ô Kính",
                  gender: "male",
                },
                {
                  name: "ô Ngự (đi mất)",
                  gender: "male",
                },
                {
                  name: "b Sáng lấy ô Chổi",
                  gender: "female",
                }
              ]
            },
            {
              name: "10.ô Kiền CB3-B.Biên",
              gender: "male",
              children: [
                {
                  name: "ô Biền-B.Hứng",
                  gender: "male",
                  children: [
                    {
                      name: "ô Phâu-B.Nữ",
                      gender: "male",
                      children: [
                        {
                          name: "b Toại lấy ô cùng làng",
                          gender: "female",
                        },
                        {
                          name: "b Lưu lấy ô ở Đào Xá",
                          gender: "female",
                        }
                      ]
                    },
                    {
                      name: "ô Chiêu",
                      gender: "male",
                    },
                    {
                      name: "b Ngân",
                      gender: "female",
                    }
                  ]
                },
                {
                  name: "ô Chuân-B.",
                  gender: "male",
                  children: [
                    {
                      name: "b Thanh lấy ô ở Nam Định",
                      gender: "female",
                    },
                    {
                      name: "ô",
                      gender: "male",
                    },
                    {
                      name: "ô Chương-B.",
                      gender: "male",
                      children: [
                        {
                          name: "b",
                          gender: "female",
                        },
                        {
                          name: "b",
                          gender: "female",
                        }
                      ]
                    },
                    {
                      name: "ô Tuệ",
                      gender: "male",
                    }
                  ]
                },
                {
                  name: "ô Toán-B.Nuôi",
                  gender: "male",
                  children: [
                    {
                      name: "ô Tính-B.Mái",
                      gender: "male",
                      children: [
                        {
                          name: "ô Sử-B.Ngần",
                          gender: "male",
                          children: [
                            {
                              name: "b Phương",
                              gender: "female",
                            },
                            {
                              name: "b Phượng lấy ô ở làng",
                              gender: "female",
                            },
                            {
                              name: "ô Tiệp-B.",
                              gender: "male",
                              children: [
                                {
                                  name: "b Gia Hân",
                                  gender: "female",
                                },
                                {
                                  name: "b Hà Nhi",
                                  gender: "female",
                                }
                              ]
                            }
                          ]
                        },
                        {
                          name: "b Nguyệt lấy ô Toản ở Đào Xá",
                          gender: "female",
                        },
                        {
                          name: "b Tuyết lấy ô Chiền cùng làng",
                          gender: "female",
                        }
                      ]
                    },
                    {
                      name: "ô Tánh (k.con)",
                      gender: "male",
                    },
                    {
                      name: "b Bình",
                      gender: "female",
                    },
                    {
                      name: "b Lơi",
                      gender: "female",
                    },
                    {
                      name: "b Cúc",
                      gender: "female",
                    },
                    {
                      name: "b Nghệ",
                      gender: "female",
                    }
                  ]
                },
                {
                  name: "ô Thới-B.Gừng",
                  gender: "male",
                  children: [
                    {
                      name: "ô Khơi-B1.Tý, B2.Thường, B3.Nhơn",
                      gender: "male",
                    },
                    {
                      name: "ô Hội (k.con)",
                      gender: "male",
                    },
                    {
                      name: "ô Bảo-B1.Len, B2.Phẽo",
                      gender: "male",
                      children: [
                        {
                          name: "ô Hựu (k.con)",
                          gender: "male",
                        },
                        {
                          name: "ô Tá-B",
                          gender: "male",
                          children: [
                            {
                              name: "ô Huynh",
                              gender: "male",
                              children: [
                                {
                                  name: "b Trang lấy chồng ở Quảng Ninh",
                                  gender: "female",
                                }
                              ]
                            },
                            {
                              name: "ô Đức",
                              gender: "male",
                            },
                            {
                              name: "b Phích lấy ô ở làng",
                              gender: "female",
                            },
                            {
                              name: "ô Tùng",
                              gender: "male",
                              children: [
                                {
                                  name: "ô Lân",
                                  gender: "male",
                                },
                                {
                                  name: "b Kiều Anh",
                                  gender: "female",
                                }
                              ]
                            },
                            {
                              name: "ô Hải (chết 13T)",
                              gender: "male",
                            },
                            {
                              name: "b Phịch đi tu ở chùa Ngô Xá",
                              gender: "female",
                            }
                          ]
                        }
                      ]
                    },
                    {
                      name: "b Cả Tụng",
                      gender: "female",
                    },
                    {
                      name: "b Sáng",
                      gender: "female",
                    }
                  ]
                }
              ]
            },
            {
              name: "11.ô Phổ CB3-B.Thụ",
              gender: "male",
              children: [
                {
                  name: "ô Lịch-B.Tít",
                  gender: "male",
                  children: [
                    {
                      name: "b Nhạn",
                      gender: "female",
                    },
                    {
                      name: "ô Sảng-B",
                      gender: "male",
                      children: [
                        {
                          name: "b Quý",
                          gender: "female",
                        },
                        {
                          name: "b Độ",
                          gender: "female",
                        }
                      ]
                    },
                    {
                      name: "ô Lai-B.Bồng",
                      gender: "male",
                      children: [
                        {
                          name: "ô Đôn-B.Sánh",
                          gender: "male",
                          children: [
                            {
                              name: "Ô Nhiên-B1",
                              gender: "male",
                            },
                            {
                              name: "b Quyên lấy ô",
                              gender: "female",
                            },
                            {
                              name: "b Nhan lấy ô Sơn cùng làng",
                              gender: "female",
                            }
                          ]
                        },
                        {
                          name: "ô Trứ-B.Hàn",
                          gender: "male",
                          children: [
                            {
                              name: "ô Chỉ",
                              gender: "male",
                            }
                          ]
                        },
                        {
                          name: "ô Thự-B.Gái",
                          gender: "male",
                          children: [
                            {
                              name: "ô Đốc",
                              gender: "male",
                            },
                            {
                              name: "ô Quản",
                              gender: "male",
                            },
                            {
                              name: "ô Tuấn",
                              gender: "male",
                            }
                          ]
                        }
                      ]
                    },
                    {
                      name: "ô Trợ (k.vợ)",
                      gender: "male",
                    }
                  ]
                },
                {
                  name: "b Loát cả",
                  gender: "female",
                }
              ]
            },
            {
              name: "b Rỹ (bà cô tổ) CB3",
              gender: "female",
            }
          ]
        },
        {
          name: "II. Cụ Quyết-B.Quyết",
          gender: "ancestor",
          children: [
            {
              name: "ô Đồ Hồ-B.Chẵn",
              gender: "male",
              children: [
                {
                  name: "ô Liễn-B.Tý",
                  gender: "male",
                  children: [
                    {
                      name: "ô Đặng-B.Nhớn",
                      gender: "male",
                      children: [
                        {
                          name: "ô Trương-B.Chút",
                          gender: "male",
                          children: [
                            {
                              name: "ô Trình-B.Mòng",
                              gender: "male",
                              children: [
                                {
                                  name: "b Xuyến lấy ô Miễn ở Nguyệt Lãng",
                                  gender: "female",
                                },
                                {
                                  name: "ô Nguyện (1 T chết)",
                                  gender: "male",
                                },
                                {
                                  name: "ô Sáng-B.Linh",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "ô Quang",
                                      gender: "male",
                                    },
                                    {
                                      name: "b Thảo",
                                      gender: "female",
                                    }
                                  ]
                                },
                                {
                                  name: "ô Chuyên-B.Anh",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "b Yến",
                                      gender: "female",
                                    }
                                  ]
                                },
                                {
                                  name: "b Xuân lấy ô Thành ở Vũ Phúc",
                                  gender: "female",
                                }
                              ]
                            },
                            {
                              name: "ô Rẫn-B.Xuân",
                              gender: "male",
                              children: [
                                {
                                  name: "b Hồng lấy ô Hịệp ở Phúc Thành",
                                  gender: "female",
                                },
                                {
                                  name: "ô Dũng",
                                  gender: "male",
                                }
                              ]
                            },
                            {
                              name: "ô Tuất-B.Thơm",
                              gender: "male",
                              children: [
                                {
                                  name: "ô Hiệp-B.Thu",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "b Anh",
                                      gender: "female",
                                    },
                                    {
                                      name: "ô Cường",
                                      gender: "male",
                                    }
                                  ]
                                },
                                {
                                  name: "b Ngoạn lấy ô Tiến ở làng Hội",
                                  gender: "female",
                                }
                              ]
                            },
                            {
                              name: "ô Đàn-B.An",
                              gender: "male",
                              children: [
                                {
                                  name: "b Trang lấy ô Dũng ở Hưng Yên",
                                  gender: "female",
                                },
                                {
                                  name: "ô Nam",
                                  gender: "male",
                                }
                              ]
                            }
                          ]
                        },
                        {
                          name: "ô Tiến (k.con)",
                          gender: "male",
                        },
                        {
                          name: "b Vẻn (Thinh) lấy ô Nhụ cùng làng",
                          gender: "female",
                        }
                      ]
                    },
                    {
                      name: "ô Thư-B.Thư",
                      gender: "male",
                      children: [
                        {
                          name: "b Trai lấy ck ở Đào Xá",
                          gender: "female",
                        }
                      ]
                    }
                  ]
                },
                {
                  name: "ô Kiển-B.Kiển",
                  gender: "male",
                  children: [
                    {
                      name: "b Trại lấy ô Rinh cùng làng",
                      gender: "female",
                    },
                    {
                      name: "ô Cổn-B1 Tôm, B2 Biên.",
                      gender: "male",
                      children: [
                        {
                          name: "b Cồn CB1 lấy ô Mại",
                          gender: "female",
                        },
                        {
                          name: "ô Kiêu CB1-B.Miền",
                          gender: "male",
                          children: [
                            {
                              name: "b Kỳ lấy ô Huấn",
                              gender: "female",
                            },
                            {
                              name: "b Cậy lấy ô Hương",
                              gender: "female",
                            },
                            {
                              name: "b Tin lấy ô Hùng",
                              gender: "female",
                            },
                            {
                              name: "ô Chung-B.Đơn",
                              gender: "male",
                              children: [
                                {
                                  name: "ô Phượng-B.Thư",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "b Ngân",
                                      gender: "female",
                                    },
                                    {
                                      name: "ô Minh",
                                      gender: "male",
                                    },
                                    {
                                      name: "ô Tú",
                                      gender: "male",
                                    }
                                  ]
                                },
                                {
                                  name: "b Cúc",
                                  gender: "female",
                                },
                                {
                                  name: "ô Pho-B.Mến",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "ô Anh",
                                      gender: "male",
                                    },
                                    {
                                      name: "b Linh",
                                      gender: "female",
                                    }
                                  ]
                                },
                                {
                                  name: "ô Phát-B.Hằng",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "b Ly",
                                      gender: "female",
                                    },
                                    {
                                      name: "ô Phong",
                                      gender: "male",
                                    }
                                  ]
                                },
                                {
                                  name: "ô Triển-B.Hằng",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "ô Hoàng",
                                      gender: "male",
                                    },
                                    {
                                      name: "ô Lãm",
                                      gender: "male",
                                    },
                                    {
                                      name: "b Ngọc",
                                      gender: "female",
                                    }
                                  ]
                                }
                              ]
                            },
                            {
                              name: "ô Nguyện-B.",
                              gender: "male",
                            },
                            {
                              name: "b Cùng lấy ô Hà cùng làng",
                              gender: "female",
                            },
                            {
                              name: "b Tại",
                              gender: "female",
                            },
                            {
                              name: "b Xuân",
                              gender: "female",
                            },
                            {
                              name: "b Hợp lấy Thịnh cùng làng",
                              gender: "female",
                            },
                            {
                              name: "ô Mão-B.Phương",
                              gender: "male",
                              children: [
                                {
                                  name: "ô Huynh",
                                  gender: "male",
                                },
                                {
                                  name: "ô Huy",
                                  gender: "male",
                                },
                                {
                                  name: "b Trúc",
                                  gender: "female",
                                },
                                {
                                  name: "ô Sang",
                                  gender: "male",
                                },
                                {
                                  name: "b Loan",
                                  gender: "female",
                                }
                              ]
                            }
                          ]
                        },
                        {
                          name: "ô Khanh CB2-B.My",
                          gender: "male",
                          children: [
                            {
                              name: "ô Chuyên đi tu công giáo",
                              gender: "male",
                            },
                            {
                              name: "b Nhài lấy ô Thủy",
                              gender: "female",
                            },
                            {
                              name: "b Sâm lấy ô",
                              gender: "female",
                            },
                            {
                              name: "ô Trưởng-B.Tuyền",
                              gender: "male",
                              children: [
                                {
                                  name: "ô Tiệp",
                                  gender: "male",
                                },
                                {
                                  name: "b Thơm",
                                  gender: "female",
                                },
                                {
                                  name: "b Nhi",
                                  gender: "female",
                                }
                              ]
                            },
                            {
                              name: "ô Thiều-B.Huyền",
                              gender: "male",
                              children: [
                                {
                                  name: "ô Duy",
                                  gender: "male",
                                },
                                {
                                  name: "ô Tuấn",
                                  gender: "male",
                                },
                                {
                                  name: "b Trâm",
                                  gender: "female",
                                }
                              ]
                            },
                            {
                              name: "ô Thẩm-B.Năm",
                              gender: "male",
                              children: [
                                {
                                  name: "b Chi",
                                  gender: "female",
                                },
                                {
                                  name: "b Trang",
                                  gender: "female",
                                },
                                {
                                  name: "ô Tuấn",
                                  gender: "male",
                                },
                                {
                                  name: "ô Hân",
                                  gender: "male",
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  name: "ô Nhâm-B.Nhâm",
                  gender: "male",
                  children: [
                    {
                      name: "b lấy ô Phô cùng làng",
                      gender: "female",
                    }
                  ]
                }
              ]
            },
            {
              name: "ô Bát Hải-B.Hải",
              gender: "male",
              children: [
                {
                  name: "ô Khiết-B.Phớt",
                  gender: "male",
                  children: [
                    {
                      name: "b Lương lấy ô cùng làng",
                      gender: "female",
                    },
                    {
                      name: "b Ổn lấy ô cùng làng",
                      gender: "female",
                    },
                    {
                      name: "b Phẩm lấy ô cùng làng",
                      gender: "female",
                    },
                    {
                      name: "b lý Thung",
                      gender: "female",
                    },
                    {
                      name: "ô Khinh",
                      gender: "male",
                    }
                  ]
                },
                {
                  name: "ô Ninh-B.Ninh",
                  gender: "male",
                  children: [
                    {
                      name: "b Chí lấy ô cùng làng",
                      gender: "female",
                    },
                    {
                      name: "b Nhường",
                      gender: "female",
                    },
                    {
                      name: "ô Bật-B",
                      gender: "male",
                      children: [
                        {
                          name: "b Bin",
                          gender: "female",
                        },
                        {
                          name: "b Lan",
                          gender: "female",
                        },
                        {
                          name: "b Lập lấy ck khê Kiều",
                          gender: "female",
                        }
                      ]
                    }
                  ]
                },
                {
                  name: "ô Chưng",
                  gender: "male",
                },
                {
                  name: "b Am 2 lấy ck khê Kiều",
                  gender: "female",
                },
                {
                  name: "b Bình Trần (k.còn ai)",
                  gender: "female",
                }
              ]
            }
          ]
        },
        {
          name: "III. Cụ Huấn (con nuôi)",
          gender: "ancestor",
          children: [
            {
              name: "ô Hỗ-B.Hỗ",
              gender: "male",
              children: [
                {
                  name: "ô Ấp-B.Khoai",
                  gender: "male",
                  children: [
                    {
                      name: "ô Khu-B.Cợp",
                      gender: "male",
                      children: [
                        {
                          name: "ô Hạp-B.Su",
                          gender: "male",
                          children: [
                            {
                              name: "ô Tản-B.Đào",
                              gender: "male",
                              children: [
                                {
                                  name: "ô Doan-B.Dậu",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "b Giang",
                                      gender: "female",
                                    },
                                    {
                                      name: "ô Lộc",
                                      gender: "male",
                                    },
                                    {
                                      name: "ô Đại",
                                      gender: "male",
                                    }
                                  ]
                                },
                                {
                                  name: "ô Diễn-B.Hạnh",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "b Duyên",
                                      gender: "female",
                                    }
                                  ]
                                },
                                {
                                  name: "ô Diện-B.Thủy",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "b Vi",
                                      gender: "female",
                                    },
                                    {
                                      name: "ô Việt",
                                      gender: "male",
                                    },
                                    {
                                      name: "b Diệp",
                                      gender: "female",
                                    }
                                  ]
                                }
                              ]
                            },
                            {
                              name: "ô Tán-B.Nhon",
                              gender: "male",
                              children: [
                                {
                                  name: "b Phương Lấy ck TP TB",
                                  gender: "female",
                                },
                                {
                                  name: "b Xoan lấy ck ở Kiến Xương",
                                  gender: "female",
                                },
                                {
                                  name: "ô Tư-B.Lê",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "ô Dũng",
                                      gender: "male",
                                    },
                                    {
                                      name: "ô Phát",
                                      gender: "male",
                                    }
                                  ]
                                }
                              ]
                            },
                            {
                              name: "ô Đoài-B.Lằm",
                              gender: "male",
                              children: [
                                {
                                  name: "b Lan lấy ck Thanh hóa",
                                  gender: "female",
                                },
                                {
                                  name: "ô Điệp-B.Bưởi",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "ô Đăng",
                                      gender: "male",
                                    },
                                    {
                                      name: "ô Ấn",
                                      gender: "male",
                                    }
                                  ]
                                },
                                {
                                  name: "ô Thái-B.Oanh",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "ô Tuấn",
                                      gender: "male",
                                    },
                                    {
                                      name: "b Thảo",
                                      gender: "female",
                                    }
                                  ]
                                }
                              ]
                            },
                            {
                              name: "ô Hởi-B.Ngần",
                              gender: "male",
                              children: [
                                {
                                  name: "ô Hải-B.Thanh",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "b Linh",
                                      gender: "female",
                                    },
                                    {
                                      name: "ô Tài",
                                      gender: "male",
                                    },
                                    {
                                      name: "b Hà",
                                      gender: "female",
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        },
                        {
                          name: "ô Khuông (mất sớm)",
                          gender: "male",
                        },
                        {
                          name: "ô Cự-B.Sợi",
                          gender: "male",
                          children: [
                            {
                              name: "b Thu lấy ô Lực cùng làng",
                              gender: "female",
                            }
                          ]
                        },
                        {
                          name: "ô Đông-B.Liên",
                          gender: "male",
                          children: [
                            {
                              name: "ô Nam-B.Thơm",
                              gender: "male",
                              children: [
                                {
                                  name: "ô Khánh",
                                  gender: "male",
                                },
                                {
                                  name: "ô Dũng",
                                  gender: "male",
                                }
                              ]
                            },
                            {
                              name: "b Hướng lấy ô Lơn cùng làng",
                              gender: "female",
                            },
                            {
                              name: "b Thoi",
                              gender: "female",
                            }
                          ]
                        },
                        {
                          name: "ô Triều-B.Ngần",
                          gender: "male",
                          children: [
                            {
                              name: "b Hường lấy ck ở Hiệp Hòa",
                              gender: "female",
                            }
                          ]
                        },
                        {
                          name: "ô Huy-B.Huyền",
                          gender: "male",
                        },
                        {
                          name: "ô Cớm-B.Tý",
                          gender: "male",
                          children: [
                            {
                              name: "ô Mạnh-B.Uy",
                              gender: "male",
                              children: [
                                {
                                  name: "ô Hùng-B.Sim",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "b Chi",
                                      gender: "female",
                                    },
                                    {
                                      name: "ô Vương",
                                      gender: "male",
                                    }
                                  ]
                                },
                                {
                                  name: "ô Hưởng-B.Bưởi",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "ô Khánh",
                                      gender: "male",
                                    },
                                    {
                                      name: "ô Khang",
                                      gender: "male",
                                    }
                                  ]
                                },
                                {
                                  name: "ô Hiển-B.Thơm",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "ô Minh",
                                      gender: "male",
                                    },
                                    {
                                      name: "ô Phát",
                                      gender: "male",
                                    }
                                  ]
                                }
                              ]
                            },
                            {
                              name: "ô Lành-B.Huế",
                              gender: "male",
                              children: [
                                {
                                  name: "b Hiền",
                                  gender: "female",
                                },
                                {
                                  name: "ô Thành-B.Hân",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "b Nhi",
                                      gender: "female",
                                    }
                                  ]
                                },
                                {
                                  name: "ô Lanh-B.Len",
                                  gender: "male",
                                  children: [
                                    {
                                      name: "b Đan",
                                      gender: "female",
                                    },
                                    {
                                      name: "ô Trường",
                                      gender: "male",
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        },
                        {
                          name: "b Lạng lấy ô cùng làng",
                          gender: "female",
                        },
                        {
                          name: "b Quy lấy ô cùng làng",
                          gender: "female",
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              name: "ô Sơn-B.Sơn (k.con)",
              gender: "male",
            }
          ]
        }
      ]
    }
  ]
};
