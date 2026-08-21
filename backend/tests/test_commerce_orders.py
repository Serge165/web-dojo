import time
from unittest.mock import patch
import server


class TestPasswordHashing:
    def test_verify_password_accepts_the_correct_password(self):
        stored = server._hash_password("correct horse battery staple")
        assert server._verify_password("correct horse battery staple", stored) is True

    def test_verify_password_rejects_the_wrong_password(self):
        stored = server._hash_password("correct horse battery staple")
        assert server._verify_password("wrong password", stored) is False

    def test_same_password_hashes_differently_each_time(self):
        # random salt per call — equal plaintexts must not produce equal hashes
        a = server._hash_password("same password")
        b = server._hash_password("same password")
        assert a != b


class TestDashboardToken:
    def test_a_freshly_issued_token_verifies_for_its_own_project(self):
        token = server._issue_dashboard_token("proj-123")
        assert server._verify_dashboard_token(token, "proj-123") is True

    def test_a_token_does_not_verify_for_a_different_project(self):
        token = server._issue_dashboard_token("proj-123")
        assert server._verify_dashboard_token(token, "proj-456") is False

    def test_an_expired_token_does_not_verify(self):
        token = server._issue_dashboard_token("proj-123", ttl_seconds=1)
        with patch("server.time.time", return_value=time.time() + 2):
            assert server._verify_dashboard_token(token, "proj-123") is False

    def test_a_tampered_token_does_not_verify(self):
        token = server._issue_dashboard_token("proj-123")
        tampered = token[:-4] + "abcd"
        assert server._verify_dashboard_token(tampered, "proj-123") is False
