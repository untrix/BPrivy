#include <boost/random/random_device.hpp>
#include <boost/random/uniform_int_distribution.hpp>
/*
int RandomPassword() {
    std::string chars(
        "abcdefghijklmnopqrstuvwxyz"
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        "1234567890"
        "!@#$%^&*()"
        "`~-_=+[{]{\\|;:'\",<.>/? ");
    boost::random::random_device rng;
    boost::random::uniform_int_distribution<> index_dist(0, chars.size() - 1);
    for(int i = 0; i < 8; ++i) {
        std::cout << chars[index_dist(rng)];
    }
    std::cout << std::endl;
}*/