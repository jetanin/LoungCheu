"""Compatibility entry point: preview/update the assigned course resources only."""
import sys
from course_cloud import main as course_main


def main(argv=None):
    return course_main(['first', *(sys.argv[1:] if argv is None else argv)])


if __name__ == '__main__':
    raise SystemExit(main())
