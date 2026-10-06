# Review B: data-dictionary shard

## Method

All 90 rows of the pack were parsed by script. For each row the source unit text was compared to the target unit text (exact equality after trimming) and, for every row, the normalized source text was searched in the candidate file named by the target (present exactly once, except heading rows and the one supersede row). Headings were checked for position and level against the candidate heading list, merge rows were checked against the full candidate block (source text present plus the second source's text), the supersede row was diffed by hand, and claimKind and disposition were judged by content.

## Rows

| row | claimId | verdict | note |
|---|---|---|---|
| R1 | claim_4333c7a8ff0e32c7b69dc10ed113f25b | verified |  |
| R2 | claim_5ba6768e5c4f7d93e77ccceda19d0103 | verified |  |
| R3 | claim_f4fb783783bb1ad062f39d73e0165f86 | verified |  |
| R4 | claim_a9bc0a5c1e4d634958dce841f0e8c44e | verified |  |
| R5 | claim_ef20fa89f544c95d36bedd6842407afc | verified |  |
| R6 | claim_5eb3738c1994942ff2c0127bd0c5144a | verified |  |
| R7 | claim_3e0b2d8ae4ea0740c26e216e927e001b | verified |  |
| R8 | claim_45d8c9d960daf36ad9a1ff2448b77509 | verified |  |
| R9 | claim_2d4168e1156696a5a8708e28af6ab369 | verified |  |
| R10 | claim_27d2b4184ee135467e1305fe686ca129 | verified |  |
| R11 | claim_f7fe1d20b37bc8712bd364582e015c3b | verified |  |
| R12 | claim_2a02b2bc8eb92cd35ad50762115b65e4 | verified |  |
| R13 | claim_0ca5b222fd5b2535bb36c3974551ae09 | verified |  |
| R14 | claim_96a7c5f5dac19f6d9ff63e1dfcc28962 | verified |  |
| R15 | claim_9ffaa331817e1de82f93b7c56ff228c7 | verified |  |
| R16 | claim_6845513e9a6cde1e5ebfde966451a579 | verified |  |
| R17 | claim_b846b2039547198ed6ff7d51f777f951 | verified |  |
| R18 | claim_caf68e55508f56223358d2924374d8cc | verified | Source text present verbatim in Writer Identity alongside the io-contract paragraph; merge is accurate. |
| R19 | claim_4d07d73af27f68f9ee6b807edba9c10f | verified |  |
| R20 | claim_44f0caaa1a43f739279c7ae528de786a | verified |  |
| R21 | claim_a07b191015c5200e7934215d59875aa0 | verified |  |
| R22 | claim_642c9f33b6f971fbe68ee92bbf3f7be9 | verified |  |
| R23 | claim_270cbd193260c5730c24a2c8cbbf21b6 | verified |  |
| R24 | claim_93255b1a693bc8ecf8b8c2a3f4142d23 | verified |  |
| R25 | claim_a26454c04b35c87528dd999234ba8454 | verified |  |
| R26 | claim_bf6de92ca9b78df2593568bab051a27f | verified |  |
| R27 | claim_075dc0205dabeaa5646879d220249ce1 | verified |  |
| R28 | claim_e9322d0e436e48b5d231ccd1b8bd441d | verified |  |
| R29 | claim_e9dddaee950b4f57b89587a1087c3ed1 | verified |  |
| R30 | claim_0735ed9860115c04597c2ce9dab4dbfc | verified |  |
| R31 | claim_fefa9cbccf0ff78f6ab65866bf0419a0 | verified |  |
| R32 | claim_eb9f287c141e9c763699b81d466f8561 | verified |  |
| R33 | claim_04a1bb7bd0c04178542bfa2a14329e4d | verified |  |
| R34 | claim_cac64e9c719a1d145d2fcf014695434a | verified |  |
| R35 | claim_b5dc9a45ef1f87d4eb34401d878d9aae | verified |  |
| R36 | claim_337c33a9b9d06d358bee210ba002a8df | verified |  |
| R37 | claim_0c44dd8aa02800039adbb9c39e5a11c7 | verified |  |
| R38 | claim_87c97f553a4be174e760b6ac1d2b37ea | verified |  |
| R39 | claim_f264a15a6f892e76499a4c229b253533 | verified |  |
| R40 | claim_eabba66d92b6698280157a68ce6db216 | verified |  |
| R41 | claim_e16f4959b70560b663e9a81c3c5556b4 | verified |  |
| R42 | claim_9aa212c8f3269e0c3e14cbfdec685caf | verified |  |
| R43 | claim_e2caa35f52aff74de3e25b4a30ea81cd | verified |  |
| R44 | claim_8ddaf275a9286c13d4d7b21c67477ef4 | verified |  |
| R45 | claim_7553a4868205098ba82d4c03382acce2 | verified |  |
| R46 | claim_d0ae088797942a95c43f0ca52517d9bc | verified |  |
| R47 | claim_a87d58b31ca7cf73cb343cadbde4b654 | verified |  |
| R48 | claim_44e9aa951025f9b7e71066c325ec7df1 | verified |  |
| R49 | claim_2bd0e21953de64329d9feda590cd9ed0 | verified |  |
| R50 | claim_05086f8eb3a7fe8c76475c68250251ce | verified |  |
| R51 | claim_279762092baa449be7ad373bf71de87e | verified |  |
| R52 | claim_3bc58175c497e265863a431437a26a14 | verified |  |
| R53 | claim_d151153b93496051a7f37890910a941f | verified |  |
| R54 | claim_0fb104a786e5dd82b98f0d9c61a4dc30 | verified |  |
| R55 | claim_606f88cc7605c316e1b735724ed595f9 | verified |  |
| R56 | claim_79b8aa6e1e59ca0593c2e3f1a409a459 | verified |  |
| R57 | claim_da3d8025b23815d0c6645830b5cb9ff8 | verified |  |
| R58 | claim_a15768b48d9cf3023d96e63365674b27 | verified |  |
| R59 | claim_726c1f9d57c58c41a038e7f8150d23bb | verified |  |
| R60 | claim_8dd85ee8dcda8f6914207ed85be88040 | verified |  |
| R61 | claim_419ab4fb5b449c511e9dfb616e074a8d | verified |  |
| R62 | claim_843ed209b05a1ea29568bfa9215da324 | verified |  |
| R63 | claim_a1109777c368dc5834c63a5934b8fd69 | verified |  |
| R64 | claim_5390e705c15f6a42a817fe0329064073 | verified |  |
| R65 | claim_9432efe67b01c2c7e33c093ec71102e1 | verified |  |
| R66 | claim_5430b3f4676f8ecc0c94b8f0680f45c6 | verified |  |
| R67 | claim_34205657a84c4f1e6610db2ea48aecde | verified |  |
| R68 | claim_be95c2d548d7fa5a1d2406be5584a36a | verified |  |
| R69 | claim_d3260e19b2405cb88b80137d2765db86 | verified |  |
| R70 | claim_f6857f25bdb3f59d3afcd03e2089ed74 | verified |  |
| R71 | claim_d2b3576164c7a12b25979e8dfb68d7b5 | verified |  |
| R72 | claim_59a22b2c3443dfe4e6a316c584d885a8 | verified |  |
| R73 | claim_f3ac7531969ff1ba2b8080d6fc83bd1a | verified |  |
| R74 | claim_2b2aa99a73a8e330673e26d15ac171e3 | verified |  |
| R75 | claim_6dfbaa59a2f49bc668d9729fed01878a | verified |  |
| R76 | claim_140216d27eb5609e8b5d51f718ecf493 | verified | Carried verbatim under its own heading; rationale truthfully notes the io-contract duplicate lives in the Envelope Shape block. |
| R77 | claim_52b54d49826d7ff8fd38f29925505f2a | verified |  |
| R78 | claim_9c6c68acbcd413ec5d826804b07650c0 | verified |  |
| R79 | claim_9959e82e2874baeb627a8441faa07e9a | verified |  |
| R80 | claim_ce947d10ed900598bde4df5b552e0265 | verified | Supersede is right: the source sentence "hôm nay chỉ `review` và `approve` mang `externalEffect: true`" is replaced by the io-contract wording (list in fgos --help --json); rationale states the change. |
| R81 | claim_15a24dbb1f2d0470f04cdf8900da67a0 | verified |  |
| R82 | claim_5dcb56608e17caeb53c197186ae33827 | verified |  |
| R83 | claim_522c26efde7ef029b3ce6e25829a8915 | verified |  |
| R84 | claim_f1eca3e6fcc3886007fa5de37d686e54 | verified |  |
| R85 | claim_6fe86521fead9cec7253443e3275a3cf | verified |  |
| R86 | claim_a374334e7c5dc565cac42c0fa641f78f | verified |  |
| R87 | claim_3a86c90c7384251f37bec19876c084db | verified |  |
| R88 | claim_712d6e9b9a98f37be1985d416565b2b5 | verified |  |
| R89 | claim_07b1d2ac34bdddeb8112613640a65ab5 | verified |  |
| R90 | claim_fcf82f5b62ebf92bd2bd6adf11cea633 | verified |  |

## Counts

- verified: 90

Row count: 90 (equals pack row count 90).

## Defect rows

None.
