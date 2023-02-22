include(Distutils)
distutils_install_module(cephfs-top)

if(WITH_TESTS)
  include(AddCephTest)
  add_tox_test(cephfs-top)
endif()

if(NOT WIN32)
set(MINIMUM_REQUIRED_VERSION 3.6)
find_package(Python3 ${MINIMUM_REQUIRED_VERSION} REQUIRED
  COMPONENTS Interpreter Development)
endif(NOT WIN32)
